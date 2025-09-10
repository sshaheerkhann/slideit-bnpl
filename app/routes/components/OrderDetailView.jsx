import {
  Card,
  Text,
  Badge,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";

export default function OrderDetailView({ order }) {
  return (
    <Card>
      <BlockStack gap="300">
        <Text variant="headingMd">{order.productTitle}</Text>
        <InlineStack gap="400" wrap={false}>
          <Text>Price: {order.price}</Text>
          <Badge status={statusToBadge(order.status)}>{order.status}</Badge>
        </InlineStack>
        <Text>Tracking ID: {order.trackingId}</Text>
        <Text>Created: {new Date(order.createdAt).toLocaleString()}</Text>
      </BlockStack>
    </Card>
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
