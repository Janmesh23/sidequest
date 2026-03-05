import { auth } from "@/auth"

export default auth((req) => {
    // The authorized callback in auth.ts handles the logic
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
