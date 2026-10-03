"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Plus, Trash2 } from "lucide-react";
import {
  createAddressSchema,
  type CreateAddressFormValues,
} from "@ecommerce/contracts";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
} from "@/lib/hooks/use-addresses";
import { FormInput } from "@/components/ui/form-input";
import { AuthRequiredDialog } from "@/components/ui/auth-required-dialog";
import { useAuthStore } from "@/lib/store/auth.store";

export function AddressesPanel() {
  const [showForm, setShowForm] = useState(false);
  const [authDialog, setAuthDialog] = useState(false);
  const user = useAuthStore((s) => s.user);

  const { data: addresses = [], isLoading, isError, refetch } = useAddresses();
  const { mutate: createAddress, isPending: isSaving } = useCreateAddress();
  const { mutate: deleteAddress, isPending: isDeleting } = useDeleteAddress();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAddressFormValues>({
    resolver: zodResolver(createAddressSchema),
    defaultValues: { country: "Pakistan" },
  });

  function onSubmit(values: CreateAddressFormValues) {
    if (!user) {
      setAuthDialog(true);
      return;
    }
    createAddress(values, {
      onSuccess: () => {
        setShowForm(false);
        reset();
      },
    });
  }

  function handleCancel() {
    setShowForm(false);
    reset();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-line">
        <h2 className="text-xs font-bold tracking-widest uppercase text-foreground">
          Saved Addresses
        </h2>
        <button
          onClick={() => setShowForm((p) => !p)}
          aria-expanded={showForm}
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-foreground hover:text-accent transition-colors bg-transparent border-none cursor-pointer"
        >
          <Plus size={13} />
          Add Address
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="bg-surface border border-line p-6 mb-6"
        >
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-4">
            New Address
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FormInput
              id="addr-first"
              label="First Name *"
              type="text"
              autoComplete="given-name"
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <FormInput
              id="addr-last"
              label="Last Name *"
              type="text"
              autoComplete="family-name"
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>

          <div className="mb-4">
            <FormInput
              id="addr-line1"
              label="Address Line 1 *"
              type="text"
              autoComplete="address-line1"
              error={errors.line1?.message}
              {...register("line1")}
            />
          </div>

          <div className="mb-4">
            <FormInput
              id="addr-line2"
              label="Address Line 2"
              type="text"
              autoComplete="address-line2"
              error={errors.line2?.message}
              {...register("line2")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FormInput
              id="addr-city"
              label="City *"
              type="text"
              autoComplete="address-level2"
              error={errors.city?.message}
              {...register("city")}
            />
            <FormInput
              id="addr-postcode"
              label="Postcode *"
              type="text"
              autoComplete="postal-code"
              error={errors.postcode?.message}
              {...register("postcode")}
            />
          </div>

          <div className="mb-4">
            <FormInput
              id="addr-label"
              label="Label"
              type="text"
              placeholder="e.g. Home, Work"
              error={errors.label?.message}
              {...register("label")}
            />
          </div>

          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-1.5">
              Country
            </p>
            <p className="text-[13px] text-secondary border border-line bg-surface px-3 py-2">
              Pakistan
            </p>
            <input type="hidden" {...register("country")} value="Pakistan" />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 px-6 bg-foreground text-white border-none text-[11px] font-bold tracking-[2px] uppercase cursor-pointer hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving…" : "Save Address"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="h-10 px-6 bg-transparent border border-line text-foreground text-[11px] font-bold tracking-widest uppercase cursor-pointer hover:border-accent hover:text-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-16">
          <p className="text-[13px] text-secondary">Loading addresses…</p>
        </div>
      ) : isError ? (
        <div className="text-center py-16 bg-surface border border-line">
          <p className="text-[13px] text-secondary mb-4" role="alert">
            We couldn&apos;t load your addresses.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center h-10 px-6 bg-foreground text-white text-[11px] font-bold tracking-[2px] uppercase border-none cursor-pointer hover:bg-accent transition-colors"
          >
            Try again
          </button>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-line">
          <MapPin size={36} className="text-muted mx-auto mb-4" />
          <p className="text-foreground font-bold text-[13px] uppercase tracking-widest mb-2">
            No addresses saved
          </p>
          <p className="text-[13px] text-secondary">
            Add a shipping address to speed up checkout.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="border border-line bg-surface p-5 flex flex-col gap-1 relative"
            >
              {addr.label && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1">
                  {addr.label}
                </span>
              )}
              <p className="text-[13px] font-semibold text-foreground">
                {addr.firstName} {addr.lastName}
              </p>
              <p className="text-[13px] text-secondary">{addr.line1}</p>
              {addr.line2 && (
                <p className="text-[13px] text-secondary">{addr.line2}</p>
              )}
              <p className="text-[13px] text-secondary">
                {addr.city}, {addr.postcode}
              </p>
              <p className="text-[13px] text-secondary">{addr.country}</p>

              <button
                type="button"
                onClick={() => deleteAddress(addr.id)}
                disabled={isDeleting}
                aria-label="Remove address"
                className="absolute top-4 right-4 text-secondary hover:text-accent transition-colors bg-transparent border-none cursor-pointer p-0 disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <AuthRequiredDialog
        open={authDialog}
        onClose={() => setAuthDialog(false)}
        message="Sign in or create an account to save addresses for faster checkout."
      />
    </div>
  );
}
