import { describe, expect, it } from "vitest";
import { jsonRequest, withId } from "@/test/http";
import * as adminVerifications from "./admin/verifications/route";
import * as aiChat from "./ai/chat/route";
import * as appointments from "./appointments/route";
import * as appointment from "./appointments/[id]/route";
import * as leads from "./leads/route";
import * as lead from "./leads/[id]/route";
import * as notifications from "./notifications/route";
import * as notification from "./notifications/[id]/route";
import * as quotes from "./quotes/route";
import * as quote from "./quotes/[id]/route";
import * as requests from "./requests/route";
import * as request from "./requests/[id]/route";
import * as reviews from "./reviews/route";

type Role = "cliente" | "proveedor" | "admin";
type Handler = (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

// [endpoint, metodo, handler, roles sin permiso]
const PROTECTED: Array<[string, string, Handler, Role[]]> = [
  ["/api/admin/verifications", "GET", adminVerifications.GET, ["cliente", "proveedor"]],
  ["/api/admin/verifications", "PATCH", adminVerifications.PATCH, ["cliente", "proveedor"]],
  ["/api/ai/chat", "POST", aiChat.POST, []],
  ["/api/appointments", "POST", appointments.POST, []],
  ["/api/appointments/:id", "PATCH", appointment.PATCH, []],
  ["/api/leads", "GET", leads.GET, []],
  ["/api/leads", "POST", leads.POST, []],
  ["/api/leads/:id", "PATCH", lead.PATCH, []],
  ["/api/notifications", "GET", notifications.GET, []],
  ["/api/notifications", "PATCH", notifications.PATCH, []],
  ["/api/notifications/:id", "PATCH", notification.PATCH, []],
  ["/api/quotes", "POST", quotes.POST, ["cliente", "admin"]],
  ["/api/quotes/:id", "PATCH", quote.PATCH, ["proveedor", "admin"]],
  ["/api/requests", "GET", requests.GET, []],
  ["/api/requests", "POST", requests.POST, ["proveedor", "admin"]],
  ["/api/requests/:id", "GET", request.GET, []],
  ["/api/requests/:id", "PATCH", request.PATCH, []],
  ["/api/reviews", "POST", reviews.POST, []],
];

describe("PR-004 control de acceso por rol en la API", () => {
  for (const [path, method, handler, forbidden] of PROTECTED) {
    it(`${method} ${path} responde 401 sin token`, async () => {
      const res = await handler(jsonRequest(method, path.replace(":id", "x"), method === "GET" ? undefined : {}, { noAuth: true }), withId("x"));
      expect(res.status).toBe(401);
    });

    for (const role of forbidden) {
      it(`${method} ${path} responde 403 al rol ${role}`, async () => {
        const res = await handler(jsonRequest(method, path.replace(":id", "x"), method === "GET" ? undefined : {}, { role }), withId("x"));
        expect(res.status).toBe(403);
      });
    }
  }

  it("rechaza un token manipulado", async () => {
    const req = new Request("http://localhost/api/requests", {
      headers: { authorization: "Bearer no-es-un-token" },
    });
    expect((await requests.GET(req)).status).toBe(401);
  });
});
