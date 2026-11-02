import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      preferredPaymentMethod: 'CASH' | 'CARD';
    } & Session['user'];
  }

  interface User {
    preferredPaymentMethod: 'CASH' | 'CARD';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    preferredPaymentMethod?: 'CASH' | 'CARD';
  }
}
