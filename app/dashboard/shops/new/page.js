import { redirect } from "next/navigation";
import SimpleForm from "@/app/SimpleForm";
import { createShop } from "@/app/actions";
import { getSupplier } from "@/lib/session";

export default async function Page() {
  if (!(await getSupplier())) redirect("/login");
  return (
    <>
      <h1>New shop</h1>
      <SimpleForm action={createShop} submit="Create shop" fields={[
        { name: "name", label: "Shop name", required: true },
        { name: "description", label: "Description", area: true },
      ]} />
    </>
  );
}
