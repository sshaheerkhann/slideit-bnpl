import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import prisma from "../db.server";
import {
  Page,
  Layout,
  Text,
  BlockStack,
  Badge,
  Button,
  InlineStack,
} from "@shopify/polaris";

export const loader = async ({ params }) => {
  const trackingId = params.trackingId;

  if (!trackingId) {
    throw new Response("Missing tracking ID", { status: 400 });
  }

  const order = await prisma.slideitOrder.findUnique({
    where: { trackingId },
  });
  console.log("Here in list and ORDER:", order)

  if (!order) {
    throw new Response("Order not found", { status: 404 });
  }

  return json({ order });
};

export default function OrderDetailPage() {
  const { order } = useLoaderData();

  return (
    <Page
      title={`Order Detail: ${order.productTitle}`}
      backAction={{ content: "Back to Orders", url: "/app/slideit-orders" }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="300">
            <Text variant="headingMd">{order.productTitle}</Text>
            <Text>Price: {order.price}</Text>
            <Text>
              Status:{" "}
              <Badge status={statusToBadge(order.status)}>{order.status}</Badge>
            </Text>
            <Text>Tracking ID: {order.trackingId}</Text>
            <Text>Created: {new Date(order.createdAt).toLocaleString()}</Text>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function statusToBadge(status) {
  switch (status.toLowerCase()) {
    case "approved":
      return "success";
    case "rejected":
      return "critical";
    case "pending":
    default:
      return "attention";
  }
}
