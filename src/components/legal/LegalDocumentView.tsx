import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { PublicLegal, LegalDocKind } from "@/lib/api";
import { LegalDocumentLayout } from "./LegalDocumentLayout";

interface LegalDocumentViewProps {
  doc: LegalDocKind;
  title: string;
  defaultLastUpdated: string;
  /** Texto por defecto, para cuando la agencia aún no publicó el suyo. */
  children: React.ReactNode;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });

/** Muestra el texto legal que la agencia editó en Configuración → Legal, o el texto por defecto. */
export function LegalDocumentView({ doc, title, defaultLastUpdated, children }: LegalDocumentViewProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["publicLegal", doc],
    queryFn: () => PublicLegal.get(doc),
    staleTime: 60_000,
  });

  // El servidor ya sanea al guardar; se vuelve a sanear aquí como segunda barrera.
  const safeHtml = useMemo(
    () => (data?.html ? DOMPurify.sanitize(data.html, { ADD_ATTR: ["target"] }) : null),
    [data?.html]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (safeHtml && !isError) {
    return (
      <LegalDocumentLayout
        title={title}
        lastUpdated={data?.updatedAt ? formatDate(data.updatedAt) : "—"}
        isDraft={false}
      >
        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
      </LegalDocumentLayout>
    );
  }

  return (
    <LegalDocumentLayout title={title} lastUpdated={defaultLastUpdated}>
      {children}
    </LegalDocumentLayout>
  );
}
