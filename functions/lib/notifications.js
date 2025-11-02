"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWeeklyReport = exports.onLargeTransaction = exports.onGoalAchieved = exports.onBudgetExceeded = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Envoyer une notification quand un budget est dépassé
 */
exports.onBudgetExceeded = functions.firestore
    .document('users/{userId}/expenses/{expenseId}')
    .onCreate(async (snapshot, context) => {
    const { userId } = context.params;
    const expense = snapshot.data();
    if (expense.type !== 'expense')
        return;
    try {
        // Récupérer la catégorie et son budget
        const categoryRef = admin.firestore()
            .collection(`users/${userId}/categories`)
            .where('name', '==', expense.category)
            .limit(1);
        const categorySnapshot = await categoryRef.get();
        if (categorySnapshot.empty)
            return;
        const category = categorySnapshot.docs[0].data();
        const budgetedAmount = category.budgetedAmount || 0;
        if (budgetedAmount === 0)
            return;
        // Calculer les dépenses totales pour cette catégorie ce mois
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const expensesSnapshot = await admin.firestore()
            .collection(`users/${userId}/expenses`)
            .where('category', '==', expense.category)
            .where('type', '==', 'expense')
            .where('date', '>=', firstDayOfMonth.toISOString().split('T')[0])
            .where('date', '<=', lastDayOfMonth.toISOString().split('T')[0])
            .get();
        const totalSpent = expensesSnapshot.docs.reduce((sum, doc) => {
            return sum + (doc.data().amountInCents || 0);
        }, 0);
        const percentUsed = (totalSpent / (budgetedAmount * 100)) * 100;
        // Envoyer une notification si le budget est dépassé à 90% ou 100%
        if (percentUsed >= 90) {
            const userDoc = await admin.firestore()
                .collection('users')
                .doc(userId)
                .get();
            const userData = userDoc.data();
            const fcmToken = userData?.fcmToken;
            if (!fcmToken)
                return;
            const message = {
                notification: {
                    title: percentUsed >= 100
                        ? '🚨 Budget dépassé !'
                        : '⚠️ Budget presque atteint',
                    body: `Vous avez dépensé ${percentUsed.toFixed(0)}% de votre budget ${category.name}`,
                    icon: '/icon-192.png',
                },
                data: {
                    type: 'budget_exceeded',
                    category: expense.category,
                    percentUsed: percentUsed.toString(),
                    url: '/categories',
                    tag: `budget-${category.name}`,
                },
                token: fcmToken,
            };
            await admin.messaging().send(message);
            console.log(`Notification envoyée pour budget dépassé: ${category.name} (${percentUsed}%)`);
        }
    }
    catch (error) {
        console.error('Erreur lors de l\'envoi de la notification de budget:', error);
    }
});
/**
 * Envoyer une notification quand un objectif est atteint
 */
exports.onGoalAchieved = functions.firestore
    .document('users/{userId}/goals/{goalId}')
    .onUpdate(async (change, context) => {
    const { userId } = context.params;
    const before = change.before.data();
    const after = change.after.data();
    // Vérifier si l'objectif vient d'être atteint
    const wasNotAchieved = (before.acquiredAmount || 0) < (before.targetAmount || 0);
    const isNowAchieved = (after.acquiredAmount || 0) >= (after.targetAmount || 0);
    if (!wasNotAchieved || !isNowAchieved)
        return;
    try {
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(userId)
            .get();
        const userData = userDoc.data();
        const fcmToken = userData?.fcmToken;
        if (!fcmToken)
            return;
        const message = {
            notification: {
                title: '🎉 Objectif atteint !',
                body: `Félicitations ! Vous avez atteint votre objectif "${after.name}"`,
                icon: '/icon-192.png',
            },
            data: {
                type: 'goal_achieved',
                goalId: context.params.goalId,
                goalName: after.name,
                url: '/goals',
                tag: `goal-${context.params.goalId}`,
                requireInteraction: 'true',
            },
            token: fcmToken,
        };
        await admin.messaging().send(message);
        console.log(`Notification envoyée pour objectif atteint: ${after.name}`);
    }
    catch (error) {
        console.error('Erreur lors de l\'envoi de la notification d\'objectif:', error);
    }
});
/**
 * Envoyer une notification pour les transactions importantes
 */
exports.onLargeTransaction = functions.firestore
    .document('users/{userId}/expenses/{expenseId}')
    .onCreate(async (snapshot, context) => {
    const { userId } = context.params;
    const transaction = snapshot.data();
    // Seuil: 10000 centimes = 100 EUR/USD
    const LARGE_AMOUNT_THRESHOLD = 10000;
    if (transaction.type !== 'expense' || transaction.amountInCents < LARGE_AMOUNT_THRESHOLD) {
        return;
    }
    try {
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(userId)
            .get();
        const userData = userDoc.data();
        const fcmToken = userData?.fcmToken;
        if (!fcmToken)
            return;
        const amount = transaction.amountInCents / 100;
        const currency = userData?.displayCurrency || 'EUR';
        const message = {
            notification: {
                title: '💰 Transaction importante',
                body: `Dépense de ${amount.toFixed(2)} ${currency} enregistrée dans ${transaction.category}`,
                icon: '/icon-192.png',
            },
            data: {
                type: 'transaction_added',
                transactionId: context.params.expenseId,
                category: transaction.category,
                amount: transaction.amountInCents.toString(),
                url: '/transactions',
                tag: 'large-transaction',
            },
            token: fcmToken,
        };
        await admin.messaging().send(message);
        console.log(`Notification envoyée pour transaction importante: ${amount} ${currency}`);
    }
    catch (error) {
        console.error('Erreur lors de l\'envoi de la notification de transaction:', error);
    }
});
/**
 * Envoyer un rapport hebdomadaire (scheduled function)
 * À exécuter chaque dimanche à 18h
 */
exports.sendWeeklyReport = functions.pubsub
    .schedule('0 18 * * 0')
    .timeZone('Europe/Paris')
    .onRun(async () => {
    console.log('Envoi des rapports hebdomadaires...');
    try {
        // Récupérer tous les utilisateurs avec un token FCM
        const usersSnapshot = await admin.firestore()
            .collection('users')
            .where('fcmToken', '!=', null)
            .get();
        const promises = usersSnapshot.docs.map(async (userDoc) => {
            const userData = userDoc.data();
            const fcmToken = userData.fcmToken;
            if (!fcmToken)
                return;
            // Calculer les dépenses de la semaine
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const expensesSnapshot = await admin.firestore()
                .collection(`users/${userDoc.id}/expenses`)
                .where('type', '==', 'expense')
                .where('date', '>=', oneWeekAgo.toISOString().split('T')[0])
                .get();
            const totalSpent = expensesSnapshot.docs.reduce((sum, doc) => {
                return sum + (doc.data().amountInCents || 0);
            }, 0);
            const amount = totalSpent / 100;
            const currency = userData.displayCurrency || 'EUR';
            const message = {
                notification: {
                    title: '📊 Votre rapport hebdomadaire',
                    body: `Cette semaine, vous avez dépensé ${amount.toFixed(2)} ${currency}`,
                    icon: '/icon-192.png',
                },
                data: {
                    type: 'report_ready',
                    reportType: 'weekly',
                    totalSpent: totalSpent.toString(),
                    url: '/reports',
                    tag: 'weekly-report',
                },
                token: fcmToken,
            };
            await admin.messaging().send(message);
        });
        await Promise.all(promises);
        console.log(`Rapports hebdomadaires envoyés à ${usersSnapshot.size} utilisateurs`);
    }
    catch (error) {
        console.error('Erreur lors de l\'envoi des rapports hebdomadaires:', error);
    }
});
