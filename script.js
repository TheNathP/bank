// --- Variables globales ---
let bank_clients = [];
let bank_accounts = [];
let transactions_history = [];
const transactions_types = ["dépôt", "retrait", "transfert", "intérêt annuel", "frais mensuels"];

// --- Fonctions Globales ---
function info(msg) { console.log("✅ " + msg); }
function error(msg) { console.error("❌ " + msg); }

function getParisTime() {
    return new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
}

function validSum(sum) {
    return typeof sum === "number" && sum > 0;
}

function clientExist(id) {
    return bank_clients.some(c => c.id === id);
}

function accountExist(id) {
    return bank_accounts.some(a => a.id === id);
}

function isArrayEmpty(array) {
    return array.length === 0;
}

function checkAccountAndSum(a_id, sum) {
    if (!accountExist(a_id)) return "Ce compte n'existe pas";
    if (!validSum(sum)) return "Somme invalide";
    return null;
}

// --- Fonctions Clients ---
function createClient(fn, ln) {
    if (typeof fn !== "string" || typeof ln !== "string") return error("Valeurs invalides");

    bank_clients.push({
        id: crypto.randomUUID(),
        firstName: fn,
        lastName: ln,
    });
    info("Client ajouté");
}

function totalAmount(c_id) {
    if (!clientExist(c_id)) return error("Ce client n'existe pas");

    const accounts = bank_accounts.filter(a => a.clientId === c_id);
    if (isArrayEmpty(accounts)) return info("Ce client ne possède pas de compte");

    const total = accounts.reduce((sum, a) => sum + a.value, 0);
    info(`Le client ${c_id} possède ${total}€ au total`);
}

// --- Fonctions Comptes ---
function createAccount(c_id, sum) {
    if (!clientExist(c_id)) return error("Ce client n'existe pas");
    if (!validSum(sum)) return error("Valeur minimale invalide");

    bank_accounts.push({
        id: crypto.randomUUID(),
        clientId: c_id,
        value: sum,
    });
    info("Compte créé");
}

function deleteAccount(a_id) {
    const account = bank_accounts.find(a => a.id === a_id);
    if (!account) return error("Ce compte n'existe pas");
    if (account.value > 0) return error(`Suppression impossible : il reste ${account.value}€ sur ce compte`);

    bank_accounts = bank_accounts.filter(a => a.id !== a_id);
    info("Compte supprimé");
}

function seeAccount(c_id, a_id) {
    const client = bank_clients.find(c => c.id === c_id);
    const account = bank_accounts.find(a => a.id === a_id);
    if (!client) return error("Ce client n'existe pas");
    if (!account) return error("Ce compte n'existe pas");

    info(`Compte ${a_id} \n
    Propriétaire : ${client.firstName} ${client.lastName} \n
    Montant : ${account.value}€`);
}

// --- Fonctions Transactions ---
function addToHistory(a_id, sum, type) {
    if (!transactions_types.includes(type)) return error("Type de transaction invalide");

    transactions_history.push({
        id: crypto.randomUUID(),
        accountId: a_id,
        transactionType: type,
        amount: sum,
        date: getParisTime(),
    });
}

function updateBalance(a_id, sum, type) {
    const account = bank_accounts.find(a => a.id === a_id);
    if (!account) return error("Ce compte n'existe pas");
    if (!validSum(sum)) return error("Somme invalide");

    if (type === "retrait" && account.value < sum) return error(`Solde insuffisant (${account.value}€)`);

    account.value += type === "retrait" ? -sum : sum;
    addToHistory(a_id, sum, type);

    info(`${type} de ${sum}€ effectué. Nouveau solde : ${account.value}€`);
}

function deposit(a_id, sum) {
    updateBalance(a_id, sum, "dépôt");
}

function withdrawal(a_id, sum) {
    updateBalance(a_id, sum, "retrait");
}

function transfer(a1_id, a2_id, sum) {
    if (!accountExist(a1_id) || !accountExist(a2_id)) return error("Un des comptes est invalide");

    const account1 = bank_accounts.find(a => a.id === a1_id);
    if (account1.value < sum) return error(`Solde insuffisant (${account1.value}€)`);

    updateBalance(a1_id, sum, "retrait");
    updateBalance(a2_id, sum, "dépôt");

    info(`Transfert de ${sum}€ effectué`);
}

function transactionsHistory(a_id) {
    if (!accountExist(a_id)) return error("Ce compte n'existe pas");

    const transactions = transactions_history.filter(t => t.accountId === a_id);
    if (isArrayEmpty(transactions)) return info("Aucune transaction");

    info(`Transactions du compte ${a_id} :`);
    transactions.forEach(t => {
        info(`| ${t.transactionType} de ${t.amount}€ le ${t.date}`);
    });
}

function interest() {
    if (isArrayEmpty(bank_accounts)) return info("Aucun compte dans la banque");

    const rate = 0.015;

    bank_accounts.forEach(account => {
        const gain = +(account.value * rate).toFixed(2);
        account.value += gain;

        addToHistory(account.id, gain, "intérêt annuel");
    });

    info(`Les intérêts annuels de ${rate * 100}% ont été ajoutés à tous les comptes.`);
}

function fee() {
    if (isArrayEmpty(bank_accounts)) return info("Aucun compte dans la banque");

    const feeAmount = 2;

    bank_accounts.forEach(account => {
        if (account.value >= feeAmount) {
            account.value -= feeAmount;

            addToHistory(account.id, feeAmount, "frais mensuels")
        } else {
            error(`Frais non appliqués au compte ${account.id} : solde insuffisant (${account.value}€)`);
        }
    });

    info(`Frais mensuels de ${feeAmount}€ appliqués à tous les comptes.`);
}

// --- Fonctions Banque ---
function totalBank() {
    if (isArrayEmpty(bank_accounts)) return info("Aucun compte");

    const total = bank_accounts.reduce((sum, a) => sum + a.value, 0);
    info(`La banque détient ${total}€`);
}