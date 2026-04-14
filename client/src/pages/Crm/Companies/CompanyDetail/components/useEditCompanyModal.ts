import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companyFormSchema, type CompanyFormData } from "@/schemas/crm.schemas";
import { useUpdateCompanyDetail } from "@/services/companies";
import { useTaxCodes } from "@/services/tax-codes";
import { usePaymentTerms } from "@/services/payment-terms";

export function useEditCompanyModal(companyId: string | undefined, company: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [editCustomFields, setEditCustomFields] = useState<Record<string, string>>({});
  const [newCustomFieldKey, setNewCustomFieldKey] = useState("");
  const [newCustomFieldValue, setNewCustomFieldValue] = useState("");

  const updateCompanyMutation = useUpdateCompanyDetail(companyId);

  const { data: taxCodes } = useTaxCodes();

  const { data: paymentTermsOptions = [] } = usePaymentTerms();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      industry: "",
      notes: "",
      accountNumber: "",
      defaultTerms: "",
      taxExempt: false,
      defaultTaxCodeId: "",
      linkedinUrl: "",
      twitterUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      otherSocialUrl: "",
    },
  });

  const openModal = () => {
    if (!company) return;

    form.reset({
      name: company.name,
      email: "",
      phone: "",
      website: company.website || "",
      industry: company.industry || "",
      notes: company.notes || "",
      accountNumber: company.accountNumber || "",
      defaultTerms: company.defaultTerms || "",
      taxExempt: company.taxExempt || false,
      defaultTaxCodeId: company.defaultTaxCodeId || "",
      linkedinUrl: company.socialMediaLinks?.linkedin || "",
      twitterUrl: company.socialMediaLinks?.twitter || "",
      facebookUrl: company.socialMediaLinks?.facebook || "",
      instagramUrl: company.socialMediaLinks?.instagram || "",
      otherSocialUrl: company.socialMediaLinks?.other || "",
    });

    setEditCustomFields(company.customFields ? { ...company.customFields } : {});
    setNewCustomFieldKey("");
    setNewCustomFieldValue("");
    setIsOpen(true);
  };

  const handleSubmit = (data: CompanyFormData) => {
    updateCompanyMutation.mutate(
      {
        id: companyId!,
        data: {
          ...data,
          customFields: editCustomFields,
        },
      } as any,
      {
        onSuccess: () => {
          setIsOpen(false);
        },
      }
    );
  };

  const updateCustomFieldValue = (key: string, value: string) => {
    setEditCustomFields({ ...editCustomFields, [key]: value });
  };

  const removeCustomField = (key: string) => {
    const updated = { ...editCustomFields };
    delete updated[key];
    setEditCustomFields(updated);
  };

  const addCustomField = () => {
    if (newCustomFieldKey.trim()) {
      setEditCustomFields({ ...editCustomFields, [newCustomFieldKey.trim()]: newCustomFieldValue });
      setNewCustomFieldKey("");
      setNewCustomFieldValue("");
    }
  };

  return {
    isOpen,
    setIsOpen,
    openModal,
    form,
    handleSubmit,
    isPending: updateCompanyMutation.isPending,
    taxCodes,
    paymentTermsOptions,
    editCustomFields,
    setEditCustomFields,
    newCustomFieldKey,
    setNewCustomFieldKey,
    newCustomFieldValue,
    setNewCustomFieldValue,
    updateCustomFieldValue,
    removeCustomField,
    addCustomField,
  };
}
