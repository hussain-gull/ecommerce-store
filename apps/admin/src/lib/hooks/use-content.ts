import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiErrorBody } from "@ecommerce/contracts";
import { useToastStore } from "../store/toast.store";
import {
  getHomeContentApi,
  updateHomeContentApi,
  getAboutContentApi,
  updateAboutContentApi,
  getContactContentApi,
  updateContactContentApi,
  getBlogContentApi,
  updateBlogContentApi,
  getConditionGuideContentApi,
  updateConditionGuideContentApi,
  getPaymentContentApi,
  updatePaymentContentApi,
} from "../api/content.api";

function createContentHooks<T>(
  key: string,
  getApi: () => Promise<T>,
  updateApi: (content: T) => Promise<T>,
  successMessage: string,
) {
  const queryKey = ["content", key] as const;

  function useContent() {
    return useQuery({ queryKey, queryFn: getApi });
  }

  function useUpdateContent() {
    const qc = useQueryClient();
    const push = useToastStore((s) => s.push);

    return useMutation({
      mutationFn: updateApi,
      onSuccess: (content: T) => {
        qc.setQueryData(queryKey, content);
        push("success", successMessage);
      },
      onError: (err: ApiErrorBody) => {
        push("error", err?.message ?? "Failed to save content.");
      },
    });
  }

  return { useContent, useUpdateContent };
}

const home = createContentHooks(
  "home",
  getHomeContentApi,
  updateHomeContentApi,
  "Home page content updated.",
);
const about = createContentHooks(
  "about",
  getAboutContentApi,
  updateAboutContentApi,
  "About page content updated.",
);
const contact = createContentHooks(
  "contact",
  getContactContentApi,
  updateContactContentApi,
  "Contact page content updated.",
);
const blog = createContentHooks(
  "blog",
  getBlogContentApi,
  updateBlogContentApi,
  "Blog content updated.",
);
const payment = createContentHooks(
  "payment",
  getPaymentContentApi,
  updatePaymentContentApi,
  "Payment details updated.",
);
const conditionGuide = createContentHooks(
  "condition-guide",
  getConditionGuideContentApi,
  updateConditionGuideContentApi,
  "Condition guide updated.",
);

export const useHomeContent = home.useContent;
export const useUpdateHomeContent = home.useUpdateContent;
export const useAboutContent = about.useContent;
export const useUpdateAboutContent = about.useUpdateContent;
export const useContactContent = contact.useContent;
export const useUpdateContactContent = contact.useUpdateContent;
export const useBlogContent = blog.useContent;
export const useUpdateBlogContent = blog.useUpdateContent;
export const useConditionGuideContent = conditionGuide.useContent;
export const useUpdateConditionGuideContent = conditionGuide.useUpdateContent;
export const usePaymentContent = payment.useContent;
export const useUpdatePaymentContent = payment.useUpdateContent;
