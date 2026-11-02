import AuthForm from "@/app/AuthForm";
import { login } from "@/app/actions";
export default function Page() {
  return (<><h1>Log in</h1><AuthForm action={login} /></>);
}
