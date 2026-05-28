// scripts/seed.ts
import { Pool } from 'pg';

// Initialize a database connection directly into the Postgres app context
const pool = new Pool({
  database: 'vaxcyte_alphafold',
});

// Original dataset retrieved right out of the active terminal session
const originalSeedData = [
  {
    name: "Hen Egg White Lysozyme",
    amino_acids: "KVFGRCELAAAMKRHGLDNYRGYSLGNWVCAAKFESNFNTQATNRNTDGSTDYGILQINSRWWCNDGRTPGSRNLCNIPCSALLSSDITASVNCAKKIVSDGNGMNAWVAWRNRCKGTDVQAWIRGCRL",
    status: "PROCESSED",
    confidence: 94.2
  },
  {
    name: "Bovine Serum Albumin (BSA) Fragment",
    amino_acids: "MKWVTFISLLLLFSSAYSRGVFRRDTHKSEIAHRFKDLGEEHFKGLVLIAFSQYLQQCPFDEHVKLVNELTEFAKTCVADESHAGCEKSLHTLFGDELCKVASLRETYGDMADCCEKQEPERNECFLSHKDDSPDLPKLKPDPNTLCDEFKADEKKFWGKYLYEIARRHPYFYAPELLYYANKYNGVFQECCQAEDKGACLLPKIETMREKVLASSARQRLRCASIQKFGERALKAWSVARLSQKFPKAEFVEVTKLVTDLTKVHKECCHGDLLECADDRADLAKYICDNQDTISSKLKECCDKPLLEKSHCIAEVEKDAIPENLPPLTADFAEDKDVCKNYQEAKDVFLGTFLYEYSRRHPDYSVSLLLRIAKTYETTLEKCCAAADPHECYAKVFDEFKPLVEEPQNLIKQNCELFEQLGEYKFQNALLVRYTKKVPQVSTPTLVEVSRSLGKVGTRCCTKPESERMPCTEDYLSLILNRLCVLHEKTPVSEKVTKCCTESLVNRRPCFSALTPDETYVPKAFDEKLFTFHADICTLPDTEKQIKK",
    status: "SUBMITTED",
    confidence: null
  },
  {
    name: "Human Insulin Precursor",
    amino_acids: "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN",
    status: "APPROVED",
    confidence: null
  },
  {
    name: "Green Fluorescent Protein (GFP)",
    amino_acids: "MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTFSYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITHGMDELYK",
    status: "IN_PROCESS",
    confidence: null
  },
  {
    name: "Human Ubiquitin",
    amino_acids: "MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG",
    status: "PROCESSED",
    confidence: 98.1
  },
  {
    name: "Myoglobin (Sperm Whale)",
    amino_acids: "MGLSDGEWQLVLNVWGKVEADIPGHGQEVLIRLFKGHPETLEKFDKFKHLKSEDEMKASEDLKKHGATVLTALGGILKKKGHHEAEIKPLAQSHATKHKIPVKYLEFISECIIQVLQSKHPGDFGADAQGAMNKALELFRKDIAAKYKELGYQG",
    status: "SUBMITTED",
    confidence: null
  },
  {
    name: "Human Hemoglobin Subunit Alpha",
    amino_acids: "MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR",
    status: "APPROVED",
    confidence: null
  },
  {
    name: "Bacteriophage T4 T4-Lysozyme",
    amino_acids: "MNIFEMLRIDEGLRLKIYKDTEGYYTIGIGHLLTKSPSLNAAKSELDKAIGRNTNGVITKDEAEKLFNQDVDAAVRGILRNAKLKPVYDSLDAVRRAALINMVFQMGETGVAGFTNSLRMLQQKRWDEAAVNLAKSRWYNQTPNRAKRVITTFRTGTWDAYKNL",
    status: "FAILED",
    confidence: null
  },
  {
    name: "Alpha-Amylase Catalyst Target",
    amino_acids: "MKLNKLVTISLLVLLSVNFAWAAAPFNGTMMQYFEWYLPDDGTLWTKVANEANNLSSLGITALWLPPAYKGTSRSDVGYGVYDLYDLGEFNQKGTVRTKYGTKAQYLQAIQAAHAAGMQVYADVVFDHKGGADGTEWVDAVEVNPSDRNQEISGTYQIQAWTKFDFPGRGNTYSSFKWRWYHFDGVDWDESRKLSRIYKFRGIGKAWDWEVDTENGNYDYLMYADLDMDHPEVVTELKNWGKWYVNTTNIDGFRLDAVKHIKFSFFPDWLSYVRSQTGKPLFTVGEYWSYDINKLHNYITKTNGTMSLFDAPLHNKFYTASKSGGAFDMRTLMTNTLMKDQPTLAVTFVDNHDTEPGQALQSWVDPWFKPLAYAFILTRQEGYPCVFYGDYYGIPQYNIPSLKSKIDPLLIARRDYAYGTQHDYLDHSDIIGWTREGVTEKPGSGLAALITDGPGGSKWMYVGKQHAGKVFYDLTGNRSDTVTINSDGWGEFKVNGGSVSVWVPRKTTVSTI",
    status: "SUBMITTED",
    confidence: null
  },
  {
    name: "Cytochrome C (Equine)",
    amino_acids: "MGDVEKGKKIFVQKCAQCHTVEKGGKHKTGPNLHGLFGRKTGQAPGFTYTDANKNKGITWKEETLMEYLENPKKYIPGTKMIFAGIKKKTEREDLIAYLKKATNE",
    status: "PROCESSED",
    confidence: 91.8
  }
];

async function runSeedEngine() {
  console.log('🚀 Initializing raw vanilla seed routine...');

  // 1. Wipe out existing data in cascading order to protect active foreign keys
  console.log('🧹 Flushing existing database entities...');
  await pool.query('TRUNCATE TABLE "Sequence", "Project", "User" CASCADE;');

  // 2. Insert primary developer scientist account
  console.log('🔬 Seeding primary platform user accounts...');
  const userQuery = `
    INSERT INTO "User" (id, email, first_name, last_name, job_title, department, role, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING id;
  `;
  const userResult = await pool.query(userQuery, [
    'usr_vaxcyte_daniel',
    'daniel.huang@vaxcyte.com',
    'Daniel',
    'Huang',
    'Bioinformatics Engineer',
    'Antigen Discovery',
    'SUPERUSER'
  ]);
  const defaultUserId = userResult.rows[0].id;

  // 3. Create a master parent workspace folder for our default alignment runs
  console.log('📁 Seeding master structural antigen folder...');
  const projectQuery = `
    INSERT INTO "Project" (id, name, description)
    VALUES ($1, $2, $3)
    RETURNING id;
  `;
  const projectResult = await pool.query(projectQuery, [
    'proj_master_baseline',
    'Vaxcyte Core Target Library',
    'Baseline protein validation structures migrated from original structural assets.'
  ]);
  const defaultProjectId = projectResult.rows[0].id;

  // 4. Loop through the original terminal structures arrays
  console.log(`🧬 Processing ${originalSeedData.length} long-form FASTA structural inputs...`);
  const sequenceQuery = `
    INSERT INTO "Sequence" (id, name, amino_acids, status, confidence, project_id, created_by_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());
  `;

  for (const item of originalSeedData) {
    const recordId = crypto.randomUUID(); // Fast native layout generation
    await pool.query(sequenceQuery, [
      recordId,
      item.name,
      item.amino_acids,
      item.status,
      item.confidence,
      defaultProjectId,
      defaultUserId
    ]);
  }

  console.log('✅ Core terminal datasets successfully written to storage loops!');
}

runSeedEngine()
  .catch((error) => {
    console.error('❌ Structural seed process error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end(); // Cleanly close socket loop backends
  });