import { ClientOnly } from "./client";

export function generateStaticParams() {
  return [
    { slug: [""] },
    { slug: ["notes"] },
    { slug: ["search"] },
    { slug: ["n"] },
    { slug: ["u"] },
    { slug: ["notifications"] },
  ];
}

export default function Page() {
  return <ClientOnly />;
}
