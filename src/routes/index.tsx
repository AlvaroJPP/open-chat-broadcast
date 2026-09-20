import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  CircleCheckBig,
  IdCard,
  Keyboard as KeyboardIcon,
  Ticket,
} from "lucide-react";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ola mundo!" },
      {
        name: "description",
        content:
          "Ola mundo!",
      },
      { property: "og:title", content: "Ola mundo!" },
      {
        property: "og:description",
        content:
          "Ola mundo!",
      },
    ],
  }),
  component: KioskApp,
});


function KioskApp() {

  return (
    <div>
      {/* Your JSX content goes here */}
      Ola mundo!
    </div>
  );
}
