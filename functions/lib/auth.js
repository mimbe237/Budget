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
exports.getPendingUsers = exports.rejectUser = exports.approveUser = exports.onUserCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const logger = functions.logger;
// Liste des emails admin autorisés
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "businessclubleader7@gmail.com,contact@beonweb.cm").split(",");
/**
 * Déclenché automatiquement à la création d'un nouveau compte Firebase Auth
 * - Crée/met à jour le document Firestore avec status=pending
 * - Désactive le compte jusqu'à validation admin
 * - Notifie les admins par email (TODO)
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    try {
        logger.info(`New user created: ${user.uid} (${user.email})`);
        // Créer ou mettre à jour le document utilisateur
        await db.collection("users").doc(user.uid).set({
            id: user.uid,
            email: user.email,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            status: "pending", // En attente de validation admin
            emailVerified: user.emailVerified,
            provider: user.providerData[0]?.providerId || "password",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        // Désactiver le compte immédiatement
        await admin.auth().updateUser(user.uid, {
            disabled: true
        });
        logger.info(`User ${user.uid} disabled, awaiting admin approval`);
        // TODO: Envoyer notification email aux admins
        // await sendAdminNotification(user);
        return null;
    }
    catch (error) {
        logger.error(`Error in onUserCreate for ${user.uid}:`, error);
        throw error;
    }
});
/**
 * Cloud Function pour approuver un utilisateur (appelée par admin)
 */
exports.approveUser = functions.https.onCall(async (data, context) => {
    // Vérifier que l'appelant est admin
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const callerEmail = context.auth.token.email;
    const isAdmin = context.auth.token.admin === true ||
        context.auth.token.role === "admin" ||
        ADMIN_EMAILS.includes(callerEmail || "");
    if (!isAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Admin access required");
    }
    const { userId } = data;
    if (!userId) {
        throw new functions.https.HttpsError("invalid-argument", "userId is required");
    }
    try {
        // Vérifier que l'utilisateur existe
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError("not-found", "User not found");
        }
        const userData = userDoc.data();
        if (userData?.status === "active") {
            throw new functions.https.HttpsError("already-exists", "User already approved");
        }
        // Mettre à jour le statut dans Firestore
        await db.collection("users").doc(userId).update({
            status: "active",
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            approvedBy: context.auth.uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Activer le compte Firebase Auth
        await admin.auth().updateUser(userId, {
            disabled: false
        });
        // Ajouter custom claim pour accès rapide
        await admin.auth().setCustomUserClaims(userId, {
            approved: true,
            approvedAt: Date.now()
        });
        logger.info(`User ${userId} approved by ${context.auth.uid}`);
        // TODO: Envoyer email de confirmation à l'utilisateur
        // await sendApprovalEmail(userId);
        return {
            success: true,
            message: "User approved successfully",
            userId
        };
    }
    catch (error) {
        logger.error(`Error approving user ${userId}:`, error);
        throw error;
    }
});
/**
 * Cloud Function pour rejeter un utilisateur (appelée par admin)
 */
exports.rejectUser = functions.https.onCall(async (data, context) => {
    // Vérifier que l'appelant est admin
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const callerEmail = context.auth.token.email;
    const isAdmin = context.auth.token.admin === true ||
        context.auth.token.role === "admin" ||
        ADMIN_EMAILS.includes(callerEmail || "");
    if (!isAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Admin access required");
    }
    const { userId, reason } = data;
    if (!userId) {
        throw new functions.https.HttpsError("invalid-argument", "userId is required");
    }
    try {
        // Vérifier que l'utilisateur existe
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError("not-found", "User not found");
        }
        // Mettre à jour le statut dans Firestore
        await db.collection("users").doc(userId).update({
            status: "rejected",
            rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectedBy: context.auth.uid,
            rejectionReason: reason || "No reason provided",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Le compte reste désactivé
        // On pourrait aussi supprimer le compte:
        // await admin.auth().deleteUser(userId);
        logger.info(`User ${userId} rejected by ${context.auth.uid}`);
        // TODO: Envoyer email de rejet à l'utilisateur
        // await sendRejectionEmail(userId, reason);
        return {
            success: true,
            message: "User rejected successfully",
            userId
        };
    }
    catch (error) {
        logger.error(`Error rejecting user ${userId}:`, error);
        throw error;
    }
});
/**
 * Cloud Function pour lister les utilisateurs en attente (appelée par admin)
 */
exports.getPendingUsers = functions.https.onCall(async (data, context) => {
    // Vérifier que l'appelant est admin
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const callerEmail = context.auth.token.email;
    const isAdmin = context.auth.token.admin === true ||
        context.auth.token.role === "admin" ||
        ADMIN_EMAILS.includes(callerEmail || "");
    if (!isAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Admin access required");
    }
    try {
        const snapshot = await db.collection("users")
            .where("status", "==", "pending")
            .orderBy("createdAt", "desc")
            .limit(100)
            .get();
        const pendingUsers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString() || null,
        }));
        return {
            success: true,
            users: pendingUsers,
            count: pendingUsers.length
        };
    }
    catch (error) {
        logger.error("Error fetching pending users:", error);
        throw error;
    }
});
