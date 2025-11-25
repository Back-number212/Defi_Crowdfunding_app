"use client"

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";

export function ThirdwebWalletConnect() {
  return (
    <ConnectButton 
      client={client}
      theme="light"
      connectModal={{
        size: "compact",
        title: "Connect Wallet",
        titleIcon: "",
        showThirdwebBranding: false,
      }}
      connectButton={{
        label: "Connect Wallet",
        className: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border-0",
      }}
    />
  );
}
