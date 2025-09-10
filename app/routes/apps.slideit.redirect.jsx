import { redirect, json } from "@remix-run/node";
import prisma from "../db.server";
import { randomUUID } from "crypto";
import axios from "axios";

export const loader = async ({ request }) => {

  console.log("Here in redirect");
  const url = new URL(request.url);
  const rawData = url.searchParams.get("data");

  if (!rawData) {
    throw new Response("Missing data", { status: 400 });
  }

  const payload = JSON.parse(rawData);
  const trackingId = randomUUID();
  const callbackUrl = `https://belfast-venue-ta-shock.trycloudflare.com/apps/slideit/callback`;

  const enrichedPayload = {
    productTitle: payload.productTitle || "Unknown Product",
    price: "1500",
    buyerName: payload.buyerName || "Ali Khan",
    buyerEmail: payload.buyerEmail || "shubhamberwal0010@gmail.com",
    shopEmail: "ahujasatyam166@gmail.com",
  };

  // Save to DB
  // await prisma.slideitOrder.create({
  //   data: {
  //     trackingId,
  //     productTitle: enrichedPayload.productTitle,
  //     price: enrichedPayload.price,
  //     status: "pending",
  //     raw: enrichedPayload,
  //   },
  // });

  // Call SlideIt API using axios
  try {
    const slideitRes = await axios.post(
      "https://apislideit.testenvapp.com/shopify-create-order",
      {
        data: enrichedPayload,
        callback: callbackUrl
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { status, redirectUrl } = slideitRes.data;

    if (!status || !redirectUrl) {
      return json(
        { error: "SlideIt response missing status or redirectUrl", details: slideitRes.data },
        { status: 502 }
      );
    }

    // ✅ Redirect user to checkout
    return redirect(redirectUrl);
  } catch (err) {
    console.error("SlideIt API error:", err?.response?.data || err.message);
    return json({ error: "Failed to communicate with SlideIt", details: err.message }, { status: 500 });
  }
};
