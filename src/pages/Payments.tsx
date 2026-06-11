import React from "react";
import PaymentsPage from "@/components/payments/PaymentsPage";
import { Helmet } from "react-helmet-async";

const Payments = () => {
  return (
    <>
      <Helmet>
        <title>Pagos | ADE Travel</title>
      </Helmet>
      <PaymentsPage />
    </>
  );
};

export default Payments;
