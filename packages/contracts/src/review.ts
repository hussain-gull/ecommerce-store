export type ReviewMedia = {
  type: "image" | "video";
  url: string;
};

// A store-wide review, gated behind a purchased order — no product_id: this
// is a thrift shop, so reviews aren't tied to one listing. One review per
// order regardless of how many line items it contains.
export type StoreReview = {
  id: string;
  userId: string;
  orderId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  media: ReviewMedia[];
  createdAt: string;
};

export type CreateReviewPayload = {
  orderId: string;
  rating: number;
  comment: string;
  media?: ReviewMedia[];
};
