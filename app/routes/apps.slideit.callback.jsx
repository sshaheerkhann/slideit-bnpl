// app/routes/apps.slideit.callback.tsx
import { json } from "@remix-run/node";
import shopify from "../shopify.server";

// REST request helper
async function shopifyRestRequest(session, method, path, data) {
  const url = `https://${session.shop}/admin/api/2025-01/${path}.json`;
  const res = await fetch(url, {
    method,
    headers: {
      "X-Shopify-Access-Token": session.accessToken,
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Shopify API ${method} ${path} failed: ${res.status} ${text}`
    );
  }

  return res.json();
}

// GraphQL request helper
async function shopifyGraphQLRequest(session, query, variables) {
  const res = await fetch(
    `https://${session.shop}/admin/api/2025-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": session.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  const json = await res.json();
  if (json.errors || json.data?.orderCancel?.orderCancelUserErrors?.length) {
    console.error("GraphQL error:", json);
    throw new Error("GraphQL request failed");
  }
  return json.data;
}

// GraphQL mutation for order cancel (requires refund argument)
const cancelOrderMutation = `
  mutation orderCancel(
    $orderId: ID!
    $reason: OrderCancelReason!
    $notifyCustomer: Boolean
    $restock: Boolean!
    $staffNote: String
    $refund: Boolean!
  ) {
    orderCancel(
      orderId: $orderId
      reason: $reason
      notifyCustomer: $notifyCustomer
      restock: $restock
      staffNote: $staffNote
      refund: $refund
    ) {
      job {
        id
        done
      }
      orderCancelUserErrors {
        code
        message
        field
      }
    }
  }
`;


export const action = async ({ request }) => {
  try {
    const body = await request.json();
    console.log("⬅️ SlideIt callback received:", body);

    // SlideIt sends { productTitle, status, price, shopEmail }
    const { productTitle: orderId, price } = body;
    const status = false; // Treat all callbacks as failed payments for testing

    if (!orderId) {
      console.error("⚠️ Invalid callback payload:", body);
      return json({ error: "Invalid callback payload" }, { status: 400 });
    }

    // Always load from the same shop domain (your dev store here)
    const sessions = await shopify.sessionStorage.findSessionsByShop(
      "slideit-app.myshopify.com"
    );
    const session = sessions?.[0];
    if (!session) {
      console.error("⚠️ No active session found for shop:", "slideit-app.myshopify.com");
      return json({ error: "No session found" }, { status: 403 });
    }
    console.log("Session:", session);

    if (status) {
      // ✅ Payment succeeded → add a sale transaction
      await shopifyRestRequest(
        session,
        "POST",
        `orders/${orderId}/transactions`,
        {
          transaction: {
            kind: "sale", // sale is valid for marking order as paid
            status: "success",
            amount: price,
            gateway: "SlideIt - Buy Now, Pay Later",
          },
        }
      );

      console.log(`✅ Order ${orderId} marked as paid.`);
    } else {
      // ❌ Payment failed → cancel the order
      const variables = {
        orderId: `gid://shopify/Order/${orderId}`,
        reason: "DECLINED",
        notifyCustomer: true,
        restock: true,
        staffNote: "SlideIt BNPL payment was declined",
        refund: false, // 👈 required now
      };

      await shopifyGraphQLRequest(session, cancelOrderMutation, variables);

      console.log(`❌ Order ${orderId} cancelled due to failed payment.`);
    }

    return json({ success: true });
  } catch (err) {
    console.error("❌ SlideIt callback error:", err);
    return json({ error: "Callback failed" }, { status: 500 });
  }
};
