import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams, useNavigate } from "@remix-run/react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  Tabs,
  ResourceList,
  TextContainer,
  InlineStack,
  Button,
  BlockStack,
} from "@shopify/polaris";
import OrderDetailView from "./components/OrderDetailView";

// Loader: fetch either order list or a single order by trackingId
export const loader = async ({ request }) => {
  const admin = await authenticate.admin(request);
  console.log("Admin Shop Orders:", admin.session.shop);
  const shop = admin.session.shop
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const trackingId = url.searchParams.get("trackingId");

  if (trackingId) {
    const order = await prisma.slideitOrder.findUnique({
      where: { trackingId },
    });
    return json({ order, trackingId, isDetail: true });
  }

  const where =
    statusFilter && statusFilter !== "all"
      ? { status: statusFilter.toLowerCase() }
      : {};

  const orders = await prisma.slideitOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return json({ orders, statusFilter: statusFilter || "all", isDetail: false });
};

export default function SlideItOrdersPage() {
  const data = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabs = [
    { id: "all", content: "All" },
    { id: "approved", content: "Approved" },
    { id: "rejected", content: "Rejected" },
  ];

  const selectedTab = tabs.findIndex(
    (tab) => tab.id === (data.statusFilter || "all")
  );

  const handleTabChange = (selectedIndex) => {
    const newStatus = tabs[selectedIndex].id;
    setSearchParams({ status: newStatus });
  };

  // 👉 Order Detail View
  if (data.isDetail && data.order) {
    const { order } = data;
    return (
      <Page
        title={`Order Details`}
        backAction={{
          content: "Back to Orders",
          onAction: () => navigate("/app/slideit-orders"),
        }}
      >
        <Layout>
          <Layout.Section>
            <Card title={order.productTitle} sectioned>
              <BlockStack gap="300">
                <InlineStack gap="300">
                  <Text variant="bodyMd" fontWeight="medium">Price:</Text>
                  <Text>{order.price} PKR</Text>
                </InlineStack>

                <InlineStack gap="300">
                  <Text variant="bodyMd" fontWeight="medium">Status:</Text>
                  <Badge status={statusToBadge(order.status)}>{order.status}</Badge>
                </InlineStack>

                <InlineStack gap="300">
                  <Text variant="bodyMd" fontWeight="medium">Tracking ID:</Text>
                  <Text>{order.trackingId}</Text>
                </InlineStack>

                <InlineStack gap="300">
                  <Text variant="bodyMd" fontWeight="medium">Created:</Text>
                  <Text>{new Date(order.createdAt).toLocaleString()}</Text>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // 📋 Order List View
  const { orders } = data;

  return (
    <Page title="SlideIt BNPL Orders">
      <Layout>
        <Layout.Section>
          <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} />

          {orders.length === 0 ? (
            <Card sectioned>
              <Text variant="bodyMd">No orders found for this filter.</Text>
            </Card>
          ) : (
            <Card>
              <ResourceList
                resourceName={{ singular: "order", plural: "orders" }}
                items={orders}
                renderItem={(order) => {
                  const { trackingId, productTitle, price, status, createdAt } = order;
                  return (
                    <ResourceList.Item
                      id={trackingId}
                      accessibilityLabel={`View details for ${productTitle}`}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set("trackingId", trackingId);
                        setSearchParams(params);
                      }}
                    >
                      <Text variant="headingSm">{productTitle}</Text>
                      <TextContainer spacing="tight">
                        <InlineStack align="space-between" wrap={true}>
                          <Text>Price: {price} PKR</Text>
                          <Badge status={statusToBadge(status)}>{status}</Badge>
                        </InlineStack>
                        <Text subdued>{new Date(createdAt).toLocaleString()}</Text>
                      </TextContainer>
                    </ResourceList.Item>
                  );
                }}
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// Badge color logic
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
