"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { env } from "./constants";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useState } from "react";

export default function Home() {
  const [isConnecting, setIsConnecting] = useState(false);

  function onConnectZoho() {
    setIsConnecting(true);
    
    const popup = window.open(
      `https://accounts.zoho.in/oauth/v2/auth?client_id=${env.ZOHO_CLIENT_ID}&response_type=code&redirect_uri=${env.ZOHO_REDIRECT_URI}&scope=ZohoMail.messages.ALL,ZohoMail.accounts.READ&access_type=offline`,
      "_blank",
      "width=600,height=700"
    );

    if (!popup) {
      setIsConnecting(false);
      toast.error("Popup Blocked", {
        description:
          "Please allow popups for this site to continue with Zoho authentication.",
      });
      return;
    }

    const messageListener = (event: MessageEvent) => {
      if (!event.origin.includes("mail.glxymesh.com")) return;

      if (event.data.type === "ZOHO_AUTH_SUCCESS") {
        toast.success("Zoho Auth Successful", {
          description: "You have successfully connected your Zoho account.",
        });
      } else if (event.data.type === "ZOHO_AUTH_ERROR") {
        toast.error("Zoho Auth Failed", {
          description:
            event.data.error ||
            "An unknown error occurred during Zoho authentication.",
        });
      }

      setIsConnecting(false);
      window.removeEventListener("message", messageListener);
      popup.close();
    };

    window.addEventListener("message", messageListener);

    const checkPopupClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopupClosed);
        window.removeEventListener("message", messageListener);
        setIsConnecting(false);
        toast.error("Zoho Auth Cancelled", {
          description:
            "You closed the Zoho authentication window before completing the process.",
        });
      }
    }, 500);
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card>
        <CardContent className="flex flex-col space-y-2 text-center w-96 items-center">
          <h1>Welcome to the Home Page</h1>
          <p>Connect to access your zoho mails</p>
          <Button 
            className="cursor-pointer" 
            onClick={onConnectZoho}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Access Zoho Mail"}
          </Button>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}