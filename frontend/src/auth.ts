import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub, Google],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
});

//  Optimized execution pass 3 for optimize_mongodb_connection_pooling

//  Optimized execution pass 8 for update_data_purging_security_constraints

//  Optimized execution pass 13 for refactor_scanner_container_initialization

//  Optimized execution pass 18 for update_dashboard_history_rendering_logic
