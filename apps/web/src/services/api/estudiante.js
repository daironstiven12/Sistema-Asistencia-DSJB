/* API del estudiante contra endpoints reales.
   - GET /attendance/sessions/by-code/:code: vista previa mínima de la
     sesión ABIERTA (sin datos sensibles) antes de pedir los datos del acta.
   - POST /attendance/registrations: registra con {code, fullName,
     identificationNumber, signatureType, signatureData, mimeType?}; la
     sesión sale del código y la trazabilidad del JWT. No se envía
     studentId/personId/sessionId/groupId.
   - GET /users/:id: perfil propio (username, estado, roles, último acceso). */

import { apiRequest } from "./http";
import { leerSesion } from "./auth";

export const estudianteApi = {
  async vistaPreviaPorCodigo(code) {
    const limpio = String(code ?? "").trim();
    if (!limpio) throw new Error("Ingresa el código de asistencia.");
    return apiRequest(`/attendance/sessions/by-code/${encodeURIComponent(limpio)}`);
  },

  async registrarAsistencia({ code, fullName, identificationNumber, signatureType, signatureData, mimeType }) {
    const data = await apiRequest("/attendance/registrations", {
      method: "POST",
      body: {
        code: String(code ?? "").trim(),
        fullName: String(fullName ?? "").trim(),
        identificationNumber: String(identificationNumber ?? "").trim(),
        signatureType,
        signatureData,
        ...(mimeType ? { mimeType } : {}),
      },
    });
    return data ?? null;
  },

  async miPerfil() {
    const { user } = leerSesion();
    if (!user?.id) throw new Error("Sin sesión activa.");
    return apiRequest(`/users/${encodeURIComponent(user.id)}`);
  },
};
