require("reflect-metadata");
const { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } = require("class-validator");
const { Type } = require("class-transformer");

class CreateSessionDto {}

IsString()(CreateSessionDto.prototype, "courseOfferingId");
IsNotEmpty()(CreateSessionDto.prototype, "courseOfferingId");
IsDateString()(CreateSessionDto.prototype, "sessionDate");
IsNotEmpty()(CreateSessionDto.prototype, "sessionDate");
IsString()(CreateSessionDto.prototype, "startTime");
IsNotEmpty()(CreateSessionDto.prototype, "startTime");
Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)(CreateSessionDto.prototype, "startTime");
IsString()(CreateSessionDto.prototype, "endTime");
IsNotEmpty()(CreateSessionDto.prototype, "endTime");
Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)(CreateSessionDto.prototype, "endTime");
IsString()(CreateSessionDto.prototype, "topics");
IsOptional()(CreateSessionDto.prototype, "topics");

class RegisterDto {}

IsString()(RegisterDto.prototype, "code");
IsNotEmpty()(RegisterDto.prototype, "code");
MaxLength(50)(RegisterDto.prototype, "code");
// Datos del acta: solo lo que el formulario solicita. Nunca studentId,
// personId, groupId ni sessionId (la sesión sale exclusivamente del código).
IsString()(RegisterDto.prototype, "fullName");
IsNotEmpty()(RegisterDto.prototype, "fullName");
MaxLength(200)(RegisterDto.prototype, "fullName");
IsString()(RegisterDto.prototype, "identificationNumber");
IsNotEmpty()(RegisterDto.prototype, "identificationNumber");
MaxLength(50)(RegisterDto.prototype, "identificationNumber");
IsString()(RegisterDto.prototype, "signatureType");
IsNotEmpty()(RegisterDto.prototype, "signatureType");
MaxLength(30)(RegisterDto.prototype, "signatureType");
IsString()(RegisterDto.prototype, "signatureData");
IsNotEmpty()(RegisterDto.prototype, "signatureData");
MaxLength(2000000)(RegisterDto.prototype, "signatureData");
IsString()(RegisterDto.prototype, "mimeType");
IsOptional()(RegisterDto.prototype, "mimeType");
MaxLength(100)(RegisterDto.prototype, "mimeType");

class SignSessionDto {}

IsString()(SignSessionDto.prototype, "signatureType");
IsNotEmpty()(SignSessionDto.prototype, "signatureType");
MaxLength(30)(SignSessionDto.prototype, "signatureType");
IsString()(SignSessionDto.prototype, "signatureData");
IsOptional()(SignSessionDto.prototype, "signatureData");
IsString()(SignSessionDto.prototype, "mimeType");
IsOptional()(SignSessionDto.prototype, "mimeType");
MaxLength(100)(SignSessionDto.prototype, "mimeType");

// Actualización parcial de la sesión: únicamente `topics` (whitelist).
// El ValidationPipe global (whitelist + forbidNonWhitelisted) rechaza
// cualquier otro campo (status, courseOfferingId, códigos, etc.).
class UpdateSessionDto {}

IsString()(UpdateSessionDto.prototype, "topics");
IsNotEmpty()(UpdateSessionDto.prototype, "topics");
MaxLength(2000)(UpdateSessionDto.prototype, "topics");

// Filtros + paginación del historial (GET /attendance/history).
// Todo opcional; la paginación se normaliza en el caso de uso.
class HistoryQueryDto {}

Type(() => Number)(HistoryQueryDto.prototype, "page");
IsOptional()(HistoryQueryDto.prototype, "page");
IsInt()(HistoryQueryDto.prototype, "page");
Min(1)(HistoryQueryDto.prototype, "page");
Type(() => Number)(HistoryQueryDto.prototype, "pageSize");
IsOptional()(HistoryQueryDto.prototype, "pageSize");
IsInt()(HistoryQueryDto.prototype, "pageSize");
Min(1)(HistoryQueryDto.prototype, "pageSize");
Max(50)(HistoryQueryDto.prototype, "pageSize");
IsOptional()(HistoryQueryDto.prototype, "status");
IsString()(HistoryQueryDto.prototype, "status");
MaxLength(30)(HistoryQueryDto.prototype, "status");
IsOptional()(HistoryQueryDto.prototype, "dateFrom");
Matches(/^\d{4}-\d{2}-\d{2}$/)(HistoryQueryDto.prototype, "dateFrom");
IsOptional()(HistoryQueryDto.prototype, "dateTo");
Matches(/^\d{4}-\d{2}-\d{2}$/)(HistoryQueryDto.prototype, "dateTo");
IsOptional()(HistoryQueryDto.prototype, "courseOfferingId");
Matches(/^\d+$/)(HistoryQueryDto.prototype, "courseOfferingId");
MaxLength(30)(HistoryQueryDto.prototype, "courseOfferingId");
IsOptional()(HistoryQueryDto.prototype, "search");
IsString()(HistoryQueryDto.prototype, "search");
MaxLength(100)(HistoryQueryDto.prototype, "search");

module.exports = { CreateSessionDto, RegisterDto, SignSessionDto, UpdateSessionDto, HistoryQueryDto };
