-- CreateTable
CREATE TABLE "Expediente" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT '',
    "prioridad" INTEGER,
    "presupuesto" DOUBLE PRECISION,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seguro" BOOLEAN NOT NULL DEFAULT false,
    "clienteNombre" TEXT NOT NULL DEFAULT '',
    "clienteDireccion" TEXT NOT NULL DEFAULT '',
    "clienteEmail" TEXT NOT NULL DEFAULT '',
    "clienteTelefono" TEXT NOT NULL DEFAULT '',
    "clienteDni" TEXT NOT NULL DEFAULT '',
    "clienteNotas" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "expedienteId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "importe" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cobrado" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3),
    "facturaPor" TEXT,
    "s1" INTEGER NOT NULL DEFAULT 0,
    "s2" INTEGER NOT NULL DEFAULT 0,
    "emp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "socio" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'draft',
    "expedienteId" TEXT,
    "pagoId" TEXT,
    "clienteNombre" TEXT NOT NULL DEFAULT '',
    "clienteDireccion" TEXT NOT NULL DEFAULT '',
    "clienteEmail" TEXT NOT NULL DEFAULT '',
    "clienteTelefono" TEXT NOT NULL DEFAULT '',
    "clienteDni" TEXT NOT NULL DEFAULT '',
    "ivaRate" DOUBLE PRECISION NOT NULL DEFAULT 21,
    "irpfRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaLinea" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL DEFAULT '',
    "base" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FacturaLinea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "concepto" TEXT NOT NULL DEFAULT '',
    "importe" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fecha" TIMESTAMP(3) NOT NULL,
    "entidad" TEXT NOT NULL DEFAULT 'empresa',
    "compensado" BOOLEAN NOT NULL DEFAULT false,
    "noComputable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocioConfig" (
    "socio" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nif" TEXT NOT NULL DEFAULT '',
    "direccion" TEXT NOT NULL DEFAULT '',
    "cp" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "iban" TEXT NOT NULL DEFAULT '',
    "facturaSerie" TEXT NOT NULL DEFAULT '2026/',
    "facturaAncho" INTEGER NOT NULL DEFAULT 3,
    "proximoNumero" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocioConfig_pkey" PRIMARY KEY ("socio")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'app',
    "formaPagoTexto" TEXT NOT NULL DEFAULT 'Transferencia bancaria al número de cuenta de ARQUIA',
    "iban" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pago_expedienteId_idx" ON "Pago"("expedienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_pagoId_key" ON "Factura"("pagoId");

-- CreateIndex
CREATE INDEX "Factura_socio_idx" ON "Factura"("socio");

-- CreateIndex
CREATE INDEX "Factura_expedienteId_idx" ON "Factura"("expedienteId");

-- CreateIndex
CREATE INDEX "FacturaLinea_facturaId_idx" ON "FacturaLinea"("facturaId");

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaLinea" ADD CONSTRAINT "FacturaLinea_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE CASCADE ON UPDATE CASCADE;
