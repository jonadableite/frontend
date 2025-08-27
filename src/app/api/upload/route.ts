// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  ALLOWED_FILE_TYPES,
  getPublicUrl,
  minioClient,
  S3_BUCKET,
  validateFileType,
} from "@/lib/minio";

export async function POST(request: NextRequest) {
  try {
    // Obter sessão do usuário
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Verificar se o usuário está autenticado
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter FormData da requisição
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("fileType") as string; // Tipo de template (image, video, etc.)

    // Validar se o arquivo foi enviado
    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 },
      );
    }

    // Validar se o tipo de arquivo (do template) foi especificado e é válido
    // A validação ALLOWED_FILE_TYPES[fileType] verifica se o fileType recebido
    // é uma chave válida no objeto ALLOWED_FILE_TYPES definido em "@/lib/minio".
    if (
      !fileType ||
      !ALLOWED_FILE_TYPES[fileType as keyof typeof ALLOWED_FILE_TYPES]
    ) {
      return NextResponse.json(
        { error: "Tipo de arquivo não especificado ou inválido" },
        { status: 400 },
      );
    }

    // Validar o tipo MIME do arquivo real contra os tipos permitidos para o fileType do template
    const allowedExtensions =
      ALLOWED_FILE_TYPES[fileType as keyof typeof ALLOWED_FILE_TYPES];
    // A função validateFileType de "@/lib/minio" deve verificar o tipo MIME ou extensão do 'file.name' ou 'file.type'.
    if (!validateFileType(file.name, allowedExtensions)) {
      // Assumindo que validateFileType usa o nome do arquivo
      return NextResponse.json(
        {
          error: `Tipo de arquivo não permitido para ${fileType}. Permitidos: ${allowedExtensions.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validar tamanho do arquivo (50MB máximo)
    const maxSize = 50 * 1024 * 1024; // 50MB em bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "Arquivo muito grande. Tamanho máximo: 50MB",
        },
        { status: 400 },
      );
    }

    // Gerar nome único para o arquivo no storage
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop();
    const fileName = `templates/${session.user.id}/${timestamp}-${randomStr}.${extension}`;

    // Converter File para Buffer para upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determinar content type para o upload
    const contentType = file.type || "application/octet-stream";

    // Upload para MinIO/S3
    // minioClient.putObject(bucketName, objectName, stream, size, metaData)
    await minioClient.putObject(S3_BUCKET, fileName, buffer, buffer.length, {
      "Content-Type": contentType,
      "x-amz-meta-original-name": file.name,
      "x-amz-meta-uploaded-by": session.user.id,
      "x-amz-meta-upload-date": new Date().toISOString(),
    });

    // Gerar URL pública do arquivo
    const publicUrl = getPublicUrl(fileName); // getPublicUrl deve gerar a URL acessível

    // Resposta de sucesso com os dados do arquivo carregado
    return NextResponse.json({
      success: true,
      fileName: fileName, // Nome no storage
      originalName: file.name, // Nome original
      url: publicUrl, // URL pública
      size: file.size, // Tamanho
      contentType: contentType, // Tipo MIME
      fileType: fileType, // Tipo do template associado
    });
  } catch (error) {
    // Logar erro no servidor
    console.error("Erro no upload:", error);
    // Resposta de erro
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
