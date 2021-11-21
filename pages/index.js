import React, { useState } from "react";
import Nav from "../components/Nav";
import Layout from "../components/Layout";
import Head from "../components/Head";

import HomePage from "../components/HomePage";
import ViewOffersPage from "../components/ViewOffersPage";
import MakeOfferPage from "../components/MakeOfferPage";

export default function Home() {
  const [page, setPage] = useState("Home");
  const [address, setAddress] = useState("");

  function renderPage() {
    if (page === "Home") {
      return (
        <HomePage
          goToAddress={(searchAddress) => {
            setAddress(searchAddress);
            setPage("MakeOffer");
          }}
        />
      );
    } else if (page === "MakeOffer") {
      return <MakeOfferPage address={address} />;
    } else if (page === "ViewOffers") {
      return <ViewOffersPage />;
    }
  }

  return (
    <Layout>
      <Head />
      <Nav
        goToHome={() => setPage("Home")}
        goToOffers={() => setPage("ViewOffers")}
      />
      {renderPage()}
    </Layout>
  );
}
