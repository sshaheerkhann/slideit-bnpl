import { json } from "@remix-run/node";
import axios from "axios";

export const action = async ({ request }) => {
  try {
    const shopDomain = request.headers.get("X-Shopify-Shop-Domain");
    const payload = await request.json();

    // Only handle SlideIt orders
    if (
      !payload.payment_gateway_names?.some((n) =>
        n.toLowerCase().includes("slideit")
      )
    ) {
      console.log("⛔ Not SlideIt order, ignoring.");
      return json({ ignored: true });
    }

    const orderId = payload.id;
    const totalPrice = payload.total_price;
    const buyerEmail = payload.customer?.email || "";
    const buyerName = `${payload.customer?.first_name || ""} ${
      payload.customer?.last_name || ""
    }`.trim();
    const shopEmail = payload.contact_email || "unknown@shop.com";
    const shopName = shopDomain || "Unknown Store";

    console.log("shopName:", shopName);
    console.log("shopEmail:", shopEmail);

    const slideItPayload = {
      data: {
        productTitle: orderId.toString(),
        price: totalPrice,
        buyerName: "Ali Khan",
        buyerEmail: "shubhamberwal.work@gmail.com",
        shopEmail: "adiaditya144@gmail.com",
        shopName: "Delhi Branch",
      },
      callback: `${process.env.APP_URL}/apps/slideit/callback`,
    };

    console.log("➡️ Sending to SlideIt:", slideItPayload);

    // Send to SlideIt API
    axios
      .post("https://apislideit.testenvapp.com/shopify-create-order", slideItPayload)
      .then((res) => console.log("✅ SlideIt response:", res.data))
      .catch((err) =>
        console.error("❌ SlideIt API error:", err.response?.data || err.message)
      );

    return json({ success: true });
  } catch (err) {
    console.error("❌ Webhook failed:", err);
    return json({ error: "Failed" }, { status: 500 });
  }
};
