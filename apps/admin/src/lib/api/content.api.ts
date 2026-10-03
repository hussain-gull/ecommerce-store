import type {
  ApiResponseBody,
  HomeContent,
  BlogContent,
  AboutUsContent,
  ContactUsContent,
  ConditionGuideContent,
  PaymentContent,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";

function getContent<T>(path: string) {
  return async (): Promise<T> => {
    const { data } = await apiClient.get<ApiResponseBody<T>>(path);
    return data.response.data[0]!;
  };
}

function updateContent<T>(path: string) {
  return async (content: T): Promise<T> => {
    const { data } = await apiClient.put<ApiResponseBody<T>>(path, content);
    return data.response.data[0]!;
  };
}

export const getHomeContentApi = getContent<HomeContent>(
  "/api/v1/content/home",
);
export const updateHomeContentApi = updateContent<HomeContent>(
  "/api/v1/content/home",
);

export const getAboutContentApi = getContent<AboutUsContent>(
  "/api/v1/content/about",
);
export const updateAboutContentApi = updateContent<AboutUsContent>(
  "/api/v1/content/about",
);

export const getContactContentApi = getContent<ContactUsContent>(
  "/api/v1/content/contact",
);
export const updateContactContentApi = updateContent<ContactUsContent>(
  "/api/v1/content/contact",
);

export const getBlogContentApi = getContent<BlogContent>(
  "/api/v1/content/blog",
);
export const updateBlogContentApi = updateContent<BlogContent>(
  "/api/v1/content/blog",
);

export const getConditionGuideContentApi = getContent<ConditionGuideContent>(
  "/api/v1/content/condition-guide",
);
export const updateConditionGuideContentApi =
  updateContent<ConditionGuideContent>("/api/v1/content/condition-guide");

export const getPaymentContentApi = getContent<PaymentContent>(
  "/api/v1/content/payment",
);
export const updatePaymentContentApi = updateContent<PaymentContent>(
  "/api/v1/content/payment",
);
