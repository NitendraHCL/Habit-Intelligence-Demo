import { PrismaClient, Role } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

// ALL 126 rows from the CSV — including NULL cug_codes and duplicates
const clients: { cugId: string; cugCode: string | null; cugName: string }[] = [
  { cugId: "b19ddd10-d041-11f0-bb18-ae2770ab2e5f-76", cugCode: "KCCP001", cugName: "KCC Paints" },
  { cugId: "8d5401d0-a57e-11ef-8ef2-2e1eb202b47b-81", cugCode: "HCLC001", cugName: "HCL Corp" },
  { cugId: "36ecb6c0-a57e-11ef-8ef2-2e1eb202b47b-10", cugCode: null, cugName: "Shiv Nadar Foundation" },
  { cugId: "51f85790-7bf1-11f0-b7df-1a0237dccdfc-35", cugCode: "JWC001", cugName: "Jio World Centre" },
  { cugId: "21c17c20-a580-11ef-af46-9e807ef599fc-24", cugCode: "HAB001", cugName: "THE HABITATS TRUST" },
  { cugId: "eda14ca0-a5a6-11ef-8ef2-2e1eb202b47b-29", cugCode: "NTA001", cugName: "Netapp India Pvt Ltd" },
  { cugId: "482d83a0-a633-11ef-8ef2-2e1eb202b47b-26", cugCode: "BML001", cugName: "BML Munjal University" },
  { cugId: "90972770-a595-11ef-af46-9e807ef599fc-40", cugCode: null, cugName: "Dupont" },
  { cugId: "d5dc1820-a5a6-11ef-af46-9e807ef599fc-14", cugCode: "ST001", cugName: "ST Microelectronics" },
  { cugId: "aa30e610-fe43-11ef-94fd-7eaadf5ed1ae-34", cugCode: "TRIP001", cugName: "Trip Factory" },
  { cugId: "1080ccc0-b3be-11f0-afe4-becef0dab4e4-53", cugCode: "HCLINFOT01", cugName: "HCL Infotech" },
  { cugId: "1d8ef400-a596-11ef-8ef2-2e1eb202b47b-19", cugCode: "Mit001", cugName: "Mitsui Chemicals" },
  { cugId: "077f1d30-a581-11ef-af46-9e807ef599fc-82", cugCode: null, cugName: "Shiv Nadar Trust" },
  { cugId: "887cb030-a57e-11ef-af46-9e807ef599fc-84", cugCode: "HCLHC001", cugName: "HCL Healthcare" },
  { cugId: "85d1f0a0-a580-11ef-af46-9e807ef599fc-36", cugCode: "HCLCP001", cugName: "HCL Capital" },
  { cugId: "e2df9fe0-b395-11ef-b263-d21cb9dedc2c-41", cugCode: null, cugName: "Test" },
  { cugId: "2c8e4ee0-a5a7-11ef-8ef2-2e1eb202b47b-87", cugCode: null, cugName: "Rico" },
  { cugId: "f3074780-a597-11ef-8ef2-2e1eb202b47b-29", cugCode: "RMZ001", cugName: "RMZ Group" },
  { cugId: "347ee1b0-a597-11ef-8ef2-2e1eb202b47b-52", cugCode: null, cugName: "RJ Corp" },
  { cugId: "8c13e1e0-a598-11ef-af46-9e807ef599fc-26", cugCode: null, cugName: "MPL Group" },
  { cugId: "8c13e1e0-a598-11ef-af46-9e807ef599fc-26", cugCode: "MPL001", cugName: "MPL Group" },
  { cugId: "8d5401d0-a57e-11ef-8ef2-2e1eb202b47b-81", cugCode: null, cugName: "HCL Corp" },
  { cugId: "e2df9fe0-b395-11ef-b263-d21cb9dedc2c-41", cugCode: null, cugName: "Test_Cug" },
  { cugId: "22d27240-3bb2-11f0-bb70-86b14f573421-19", cugCode: "SAP001", cugName: "SAP" },
  { cugId: "41ebab00-b3bd-11f0-a3d4-027cae070757-28", cugCode: "3EET01", cugName: "3E Education Trust" },
  { cugId: "e36a6dc0-a57e-11ef-8ef2-2e1eb202b47b-72", cugCode: null, cugName: "SSN Student" },
  { cugId: "e2df9fe0-b395-11ef-b263-d21cb9dedc2c-41", cugCode: null, cugName: "Test_Cug" },
  { cugId: "8f94df30-a580-11ef-af46-9e807ef599fc-57", cugCode: null, cugName: "Vamasundari" },
  { cugId: "a8837b30-f271-11ef-8b6a-dae7f211e5c7-646594700", cugCode: "VCS001", cugName: "Virtusa Consulting Services Pvt Ltd" },
  { cugId: "0c95d740-e2d6-11ef-b858-8ee2f6a1c8b9-88", cugCode: "CISCO001", cugName: "CISCO Systems" },
  { cugId: "4404d8e0-a580-11ef-8ef2-2e1eb202b47b-41", cugCode: null, cugName: "HCL Technologies" },
  { cugId: "b6780af0-1b9a-11f1-9aa0-d6c6cbef4aa0-99", cugCode: "MEDIASSIST01", cugName: "Mediassist Dvara Solutions" },
  { cugId: "e8c31070-a596-11ef-8ef2-2e1eb202b47b-12", cugCode: "Adv001", cugName: "Advisor 360" },
  { cugId: "cafe4b00-bed1-11ef-9a0e-8685de1e4757-54", cugCode: "RJ002", cugName: "RJ Foundation" },
  { cugId: "077f1d30-a581-11ef-af46-9e807ef599fc-82", cugCode: "SNT001", cugName: "Shiv Nadar Trust" },
  { cugId: "a32d7710-a7f4-11f0-ab6c-ca043d81ba17-95", cugCode: "TKNK001", cugName: "Takenaka India Private Limited" },
  { cugId: "db8912c0-cff7-11ef-be2e-8e8add4c3bef-33", cugCode: "NSP001", cugName: "Nagarro Software Private Ltd" },
  { cugId: "2050b780-e476-11f0-bd27-9ef2e1d2dce2-43", cugCode: "TKEIPVT", cugName: "TK Elevator India Pvt Ltd" },
  { cugId: "4ddac6d0-3bb8-11f0-8056-7a0964f0f2b3-4", cugCode: "CISCO01", cugName: "CISCO" },
  { cugId: "afb404f0-a597-11ef-af46-9e807ef599fc-49", cugCode: "GLU001", cugName: "Galgotias University" },
  { cugId: "c8c4ac00-f345-11ef-8924-0a616a1e4b14-47", cugCode: "ACCEL01", cugName: "Accel" },
  { cugId: "f3074780-a597-11ef-8ef2-2e1eb202b47b-29", cugCode: null, cugName: "RMZ Group" },
  { cugId: "10eb7030-a595-11ef-8ef2-2e1eb202b47b-94", cugCode: null, cugName: "TATA ADVANCED SYSTEMS LTD" },
  { cugId: "f5a34690-a580-11ef-8ef2-2e1eb202b47b-59", cugCode: "MGC001", cugName: "The Magic Years Education" },
  { cugId: "59263660-a5a8-11ef-8ef2-2e1eb202b47b-23", cugCode: "GGL001", cugName: "Google India" },
  { cugId: "5a175250-a596-11ef-af46-9e807ef599fc-12", cugCode: null, cugName: "Worley" },
  { cugId: "d9b81f00-a594-11ef-8ef2-2e1eb202b47b-25", cugCode: "AMP001", cugName: "Amphenol Communications" },
  { cugId: "ac928ec0-a599-11ef-af46-9e807ef599fc-68", cugCode: "BRT001", cugName: "Britania Industries Ltd" },
  { cugId: "55f0ca60-a5a7-11ef-8ef2-2e1eb202b47b-53", cugCode: "ORC001", cugName: "Orient Cement (OC)" },
  { cugId: "f5a34690-a580-11ef-8ef2-2e1eb202b47b-59", cugCode: null, cugName: "The Magic Years Education" },
  { cugId: "ca22fb80-a57d-11ef-af46-9e807ef599fc-82", cugCode: null, cugName: "KNMA" },
  { cugId: "7b868670-a5a7-11ef-8ef2-2e1eb202b47b-74", cugCode: "GMR001", cugName: "GMR Group" },
  { cugId: "8bb9bd50-a57f-11ef-af46-9e807ef599fc-57", cugCode: "SNUC002", cugName: "Shiv Nadar University Chennai Student" },
  { cugId: "fb4462c0-a57e-11ef-8ef2-2e1eb202b47b-50", cugCode: null, cugName: "Vidyagyan" },
  { cugId: "8bb9bd50-a57f-11ef-af46-9e807ef599fc-57", cugCode: null, cugName: "Shiv Nadar University Chennai Student" },
  { cugId: "ca22fb80-a57d-11ef-af46-9e807ef599fc-82", cugCode: "KNM001", cugName: "KNMA" },
  { cugId: "28a38550-a595-11ef-8ef2-2e1eb202b47b-16", cugCode: "KEL001", cugName: "Kelvion" },
  { cugId: "02a160f0-a597-11ef-af46-9e807ef599fc-92", cugCode: "Abb001", cugName: "Abbott" },
  { cugId: "fb4462c0-a57e-11ef-8ef2-2e1eb202b47b-50", cugCode: "VDG001", cugName: "Vidyagyan" },
  { cugId: "95ac9580-a57f-11ef-af46-9e807ef599fc-78", cugCode: "HCLF001", cugName: "HCL Foundation" },
  { cugId: "8b980d10-a596-11ef-af46-9e807ef599fc-5", cugCode: "Blu001", cugName: "Bluestar" },
  { cugId: "2c8e4ee0-a5a7-11ef-8ef2-2e1eb202b47b-87", cugCode: "RIC001", cugName: "Rico" },
  { cugId: "ae1e70d0-a597-11ef-af46-9e807ef599fc-29", cugCode: "Hil001", cugName: "Hilti" },
  { cugId: "96ddc280-a57f-11ef-af46-9e807ef599fc-48", cugCode: "JPM001", cugName: "JPMC" },
  { cugId: "4ea2ece0-983e-11f0-b386-0217bc895965-9", cugCode: "MEL001", cugName: "Malco Energy Limited" },
  { cugId: "ee168e60-a57f-11ef-8ef2-2e1eb202b47b-19", cugCode: null, cugName: "Shiv Nadar University (Corporate)" },
  { cugId: "635b4e00-cff5-11ef-a27c-4ac4d4d58e78-49", cugCode: "MS001", cugName: "Morgan Stanley (MS)" },
  { cugId: "8f94df30-a580-11ef-af46-9e807ef599fc-57", cugCode: "VMS001", cugName: "Vamasundari" },
  { cugId: "95ac9580-a57f-11ef-af46-9e807ef599fc-78", cugCode: null, cugName: "HCL Foundation" },
  { cugId: "8c2e80b0-a596-11ef-8ef2-2e1eb202b47b-37", cugCode: null, cugName: "Newgen" },
  { cugId: "8ff67aa0-a595-11ef-8ef2-2e1eb202b47b-35", cugCode: "Sup001", cugName: "Supreme" },
  { cugId: "33e7d270-a59b-11f0-b6a7-226d6cc378ba-12574851", cugCode: "SAFRAN", cugName: "Safran" },
  { cugId: "4404d8e0-a580-11ef-8ef2-2e1eb202b47b-41", cugCode: "HCLT001", cugName: "HCL Technologies" },
  { cugId: "55f0ca60-a5a7-11ef-8ef2-2e1eb202b47b-53", cugCode: null, cugName: "Orient Cement (OC)" },
  { cugId: "4404d8e0-a580-11ef-8ef2-2e1eb202b47b-41", cugCode: null, cugName: "HCL Technologies" },
  { cugId: "e0453a20-a598-11ef-8ef2-2e1eb202b47b-47", cugCode: "IDFC001", cugName: "IDFC Bank" },
  { cugId: "10eb7030-a595-11ef-8ef2-2e1eb202b47b-94", cugCode: "TAS001", cugName: "TATA ADVANCED SYSTEMS LTD" },
  { cugId: "9f028a10-30ab-11f0-a3bf-5a26385b2382-159752755", cugCode: "LARSEN01", cugName: "Larsen & Toubro" },
  { cugId: "887cb030-a57e-11ef-af46-9e807ef599fc-84", cugCode: null, cugName: "HCL Healthcare" },
  { cugId: "41f9d9e0-145e-11f0-9274-f681b26af6d5-313945662", cugCode: "AMPH001", cugName: "Amphenol HSIO India Pvt Ltd" },
  { cugId: "7a074330-66b7-11f0-a540-625ce6da3c5e-43", cugCode: "FSI001", cugName: "FS India Solar Ventures Private Limited" },
  { cugId: "b77fb630-a57d-11ef-af46-9e807ef599fc-22", cugCode: "SNU002", cugName: "Shiv Nadar University Student" },
  { cugId: "36ecb6c0-a57e-11ef-8ef2-2e1eb202b47b-10", cugCode: "SNF001", cugName: "Shiv Nadar Foundation" },
  { cugId: "0c95d740-e2d6-11ef-b858-8ee2f6a1c8b9-88", cugCode: "CISCO001", cugName: "Nagarro CUG" },
  { cugId: "e36a6dc0-a57e-11ef-8ef2-2e1eb202b47b-72", cugCode: "SSN002", cugName: "SSN Student" },
  { cugId: "b2334260-b3bd-11f0-b6a7-226d6cc378ba-1614886855", cugCode: "HCLINFO01", cugName: "HCL Infosystems" },
  { cugId: "eda14ca0-a5a6-11ef-8ef2-2e1eb202b47b-29", cugCode: null, cugName: "Netapp India Pvt Ltd" },
  { cugId: "1bd2f9d0-fe43-11ef-94fd-7eaadf5ed1ae-31", cugCode: "GUVI001", cugName: "Guvi" },
  { cugId: "21c17c20-a580-11ef-af46-9e807ef599fc-24", cugCode: null, cugName: "THE HABITATS TRUST" },
  { cugId: "0bfbdfd0-2bd5-11f0-be20-fa756090632d-80", cugCode: "DEMO001Health", cugName: "Demo health" },
  { cugId: "5a224640-a57f-11ef-8ef2-2e1eb202b47b-92", cugCode: "RET001", cugName: "Retail" },
  { cugId: "8c2e80b0-a596-11ef-8ef2-2e1eb202b47b-37", cugCode: "NGN001", cugName: "Newgen" },
  { cugId: "b77fb630-a57d-11ef-af46-9e807ef599fc-22", cugCode: null, cugName: "Shiv Nadar University Student" },
  { cugId: "77e824a0-a594-11ef-af46-9e807ef599fc-38", cugCode: "HYU001", cugName: "Hyundai Engineering" },
  { cugId: "d5dc1820-a5a6-11ef-af46-9e807ef599fc-14", cugCode: null, cugName: "ST Microelectronics" },
  { cugId: "c63e4740-a57d-11ef-8ef2-2e1eb202b47b-9", cugCode: null, cugName: "SSN Corporate" },
  { cugId: "4a83dc80-a57f-11ef-af46-9e807ef599fc-40", cugCode: null, cugName: "Shiv Nadar University Chennai (Corporate)" },
  { cugId: "d9b81f00-a594-11ef-8ef2-2e1eb202b47b-25", cugCode: null, cugName: "Amphenol Communications" },
  { cugId: "5c05b720-d00f-11ef-be2e-8e8add4c3bef-29", cugCode: "GCOF001", cugName: "Galgotia College of Engineering (GCE)" },
  { cugId: "ee168e60-a57f-11ef-8ef2-2e1eb202b47b-19", cugCode: "SNU001", cugName: "Shiv Nadar University (Corporate)" },
  { cugId: "5a175250-a596-11ef-af46-9e807ef599fc-12", cugCode: "WOR001", cugName: "Worley" },
  { cugId: "f73a37b0-268c-11f0-95d8-866cc9fb3319-95", cugCode: "GLL001", cugName: "GlobalLogic" },
  { cugId: "fa7572d0-a5a6-11ef-8ef2-2e1eb202b47b-50", cugCode: "MMT001", cugName: "Make My Trip (MMT)" },
  { cugId: "8650b880-cffc-11ef-a27c-4ac4d4d58e78-49", cugCode: "VHI001", cugName: "Volo Health" },
  { cugId: "7296f9d0-d8b2-11ef-bae7-c6a7233ae496-63", cugCode: "XCB001", cugName: "Xcube" },
  { cugId: "4a83dc80-a57f-11ef-af46-9e807ef599fc-40", cugCode: "SNUC001", cugName: "Shiv Nadar University Chennai (Corporate)" },
  { cugId: "afb404f0-a597-11ef-af46-9e807ef599fc-49", cugCode: null, cugName: "Galgotias University" },
  { cugId: "aae4d8e0-3bb1-11f0-8056-7a0964f0f2b3-39", cugCode: "TFMC001", cugName: "Technip FMC" },
  { cugId: "e2df9fe0-b395-11ef-b263-d21cb9dedc2c-41", cugCode: "TC0001", cugName: "Test" },
  { cugId: "63f0c240-8315-11f0-980d-ce493777bdc7-2", cugCode: "ALS001", cugName: "Aragen LifeScience" },
  { cugId: "347ee1b0-a597-11ef-8ef2-2e1eb202b47b-52", cugCode: "RJ001", cugName: "RJ Corp" },
  { cugId: "c2e3ad60-bdfa-11f0-881c-5aa291594a2d-56", cugCode: "HHCS001", cugName: "HCL Healthcare Corporate Sales" },
  { cugId: "c63e4740-a57d-11ef-8ef2-2e1eb202b47b-9", cugCode: "SSN001", cugName: "SSN Corporate" },
  { cugId: "85d1f0a0-a580-11ef-af46-9e807ef599fc-36", cugCode: null, cugName: "HCL Capital" },
  { cugId: "7a42f140-048e-11f0-8b71-ba04adf907d3-64", cugCode: "KXPERT001", cugName: "KareXpert Technologies Pvt Ltd" },
  { cugId: "ac928ec0-a599-11ef-af46-9e807ef599fc-68", cugCode: null, cugName: "Britania Industries Ltd" },
  { cugId: "53b682f0-e497-11f0-b81f-766f91540582-21", cugCode: "NTTDATA01", cugName: "NTT Data" },
  { cugId: "5a224640-a57f-11ef-8ef2-2e1eb202b47b-92", cugCode: null, cugName: "Retail" },
  { cugId: "96ddc280-a57f-11ef-af46-9e807ef599fc-48", cugCode: null, cugName: "JPMC" },
  { cugId: "482d83a0-a633-11ef-8ef2-2e1eb202b47b-26", cugCode: null, cugName: "BML Munjal University" },
  { cugId: "d7483ad0-1617-11f1-8b67-f22eb7133b59-33", cugCode: "CIEAIL01", cugName: "CIE Automotive India Ltd" },
  { cugId: "90972770-a595-11ef-af46-9e807ef599fc-40", cugCode: "DUP001", cugName: "Dupont" },
  { cugId: "b6fc9eb0-66b8-11f0-bbfc-eeb533408514-62", cugCode: "BRIDGE01", cugName: "Bridgestone India Pvt Ltd" },
  { cugId: "b98833c0-a5a6-11ef-8ef2-2e1eb202b47b-67", cugCode: "Joh001", cugName: "Johnson Controls International (JCI)" },
  { cugId: "603d38e0-093f-11f0-a303-76d17470edd8-1526883812", cugCode: "IGTI001", cugName: "Ingeteam India Private Ltd" },
];

async function main() {
  console.log("Seeding database...");

  // ── 0. Clear ALL existing data ──
  console.log("  Clearing all existing data...");
  await prisma.dashboardAnnotation.deleteMany();
  await prisma.userClientAssignment.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();
  console.log("  All data cleared");

  // ── 1. Insert all 126 client rows ──
  let count = 0;
  for (const c of clients) {
    await prisma.client.create({
      data: {
        cugId: c.cugId,
        cugCode: c.cugCode,
        cugName: c.cugName,
      },
    });
    count++;
  }
  console.log(`  ${count} client rows inserted`);

  // ── 2. Users ──
  const hash = await bcryptjs.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@habithealth.com" },
    update: {},
    create: {
      email: "admin@habithealth.com",
      passwordHash: hash,
      name: "Super Admin",
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "richa@habithealth.com" },
    update: {},
    create: {
      email: "richa@habithealth.com",
      passwordHash: hash,
      name: "Richa Jain",
      role: Role.KAM,
      isActive: true,
    },
  });

  const hclt = await prisma.client.findFirst({ where: { cugCode: "HCLT001" } });
  if (hclt) {
    await prisma.user.upsert({
      where: { email: "admin@hcl.com" },
      update: { clientId: hclt.id },
      create: {
        email: "admin@hcl.com",
        passwordHash: hash,
        name: "HCL Admin",
        role: Role.CLIENT_ADMIN,
        clientId: hclt.id,
        isActive: true,
      },
    });
  }

  const jpmc = await prisma.client.findFirst({ where: { cugCode: "JPM001" } });
  if (jpmc) {
    await prisma.user.upsert({
      where: { email: "admin@jpmc.com" },
      update: { clientId: jpmc.id },
      create: {
        email: "admin@jpmc.com",
        passwordHash: hash,
        name: "JPMC Admin",
        role: Role.CLIENT_ADMIN,
        clientId: jpmc.id,
        isActive: true,
      },
    });
  }

  console.log("  Users seeded");

  // ── 3. KAM assignments ──
  const kam = await prisma.user.findUnique({ where: { email: "richa@habithealth.com" } });
  if (kam) {
    const majorCodes = ["HCLT001", "JPM001", "CISCO01", "MS001", "TAS001", "GGL001", "BRT001", "GMR001", "NGN001", "MMT001"];
    for (const code of majorCodes) {
      const client = await prisma.client.findFirst({ where: { cugCode: code } });
      if (client) {
        await prisma.userClientAssignment.upsert({
          where: { userId_clientId: { userId: kam.id, clientId: client.id } },
          update: {},
          create: { userId: kam.id, clientId: client.id, role: Role.KAM },
        });
      }
    }
    console.log("  KAM assignments seeded");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
