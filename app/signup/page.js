import AuthForm from "@/app/AuthForm";
import { signup } from "@/app/actions";
export default function Page() {
  return (<><h1>Supplier sign up</h1><AuthForm action={signup} signup /></>);
}
