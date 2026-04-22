import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import PaymentsPage from "@/components/payments/PaymentsPage";
import { Helmet } from "react-helmet-async";

const Payments = () => {
  return (
    <AppLayout>
      <Helmet>
        <title>Pagos | ADE Travel</title>
      </Helmet>
      <PaymentsPage />
    </AppLayout>
  );
};

export default Payments;
