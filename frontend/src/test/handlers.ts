import { http, HttpResponse } from "msw";

const productFixture = [
  {
    id: "product-1",
    name: "Monitor 27\"",
    description: "Pantalla QHD",
    price: 1200000,
    imageUrl: "https://picsum.photos/640/480",
    stock: 8,
    category: "Monitores",
  },
];

export const handlers = [
  http.get("*/api/products", () => {
    return HttpResponse.json({ success: true, data: productFixture });
  }),
  http.post("*/api/payment/process", async () => {
    return HttpResponse.json({
      success: true,
      transaction: {
        id: "tx-1",
        reference: "TX-TEST-1",
        status: "PENDING",
        totalAmount: 1207500,
      },
    });
  }),
  http.get(
    "*/api/transactions/reference/:reference/sync",
    ({ params }: { params: { reference: string } }) => {
    return HttpResponse.json({
      success: true,
      transaction: {
        id: "tx-1",
        reference: String(params.reference),
        status: "APPROVED",
        totalAmount: 1207500,
        externalTransactionId: "ext-123",
      },
      updated: true,
    });
    },
  ),
];
