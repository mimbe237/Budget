"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { initializeFirebase } from '@/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

type HomeContent = {
	title: string;
	subtitle: string;
	ctaLabel: string;
	ctaHref: string;
	heroImage: string;
	bannerImage: string;
};

const STORAGE_KEY = 'admin_homepage_content_v1';

const DEFAULTS: HomeContent = {
	title: 'Pilotez votre budget avec précision et simplicité.',
	subtitle: "Catégories intelligentes, objectifs d’épargne, analytics clairs.",
	ctaLabel: 'Démarrer gratuitement',
	ctaHref: '#',
	heroImage: '/images/hero-placeholder.png',
	bannerImage: '/images/banner-placeholder.png',
};

export default function AdminHomepageEditor() {
	const [content, setContent] = useState<HomeContent>(DEFAULTS);
	const [status, setStatus] = useState<string | null>(null);
	const { firestore } = initializeFirebase();
	const homepageRef = useMemo(() => doc(firestore, 'adminConfig', 'homepage'), [firestore]);

	useEffect(() => {
		// Subscribe to Firestore; if permission denied, fallback to localStorage
		const unsub = onSnapshot(
			homepageRef,
			(snap) => {
				if (snap.exists()) {
					const data = snap.data() as Partial<HomeContent>;
					setContent({ ...DEFAULTS, ...data } as HomeContent);
				} else {
					// If doc missing, keep defaults
					setContent(DEFAULTS);
				}
				setStatus(null);
			},
			async (err) => {
				console.warn('Firestore read failed, using localStorage fallback', err);
				try {
					const raw = localStorage.getItem(STORAGE_KEY);
					if (raw) setContent(JSON.parse(raw));
					setStatus('Mode local (permissions Firestore manquantes)');
				} catch (e) {
					// silent
				}
			}
		);
		return () => unsub();
	}, []);

		async function save() {
			// Try Firestore first, fallback to localStorage on permission or network errors
			try {
				await setDoc(homepageRef, content, { merge: true });
				setStatus('Enregistré dans Firestore');
				setTimeout(() => setStatus(null), 2000);
			} catch (e) {
				console.warn('Firestore write failed, saving locally instead', e);
				try {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
					setStatus('Permissions insuffisantes — Enregistré localement');
					setTimeout(() => setStatus(null), 2500);
				} catch (err) {
					setStatus("Erreur lors de l'enregistrement");
				}
			}
		}

	function resetDefaults() {
		setContent(DEFAULTS);
		setStatus('Réinitialisé');
		setTimeout(() => setStatus(null), 1500);
	}

	return (
		<div className="p-6">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Éditeur - Page d'accueil</h1>
						<Link href="/admin" className="text-sm text-primary hover:underline">Retour au tableau de bord</Link>
			</header>

			<main className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<section className="space-y-4">
					<label className="block">
						<span className="text-sm font-medium">Titre principal</span>
						<input
							value={content.title}
							onChange={(e) => setContent({ ...content, title: e.target.value })}
							className="mt-1 block w-full rounded-md border px-3 py-2"
						/>
					</label>

					<label className="block">
						<span className="text-sm font-medium">Sous-titre</span>
						<textarea
							value={content.subtitle}
							onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
							className="mt-1 block w-full rounded-md border px-3 py-2 h-24"
						/>
					</label>

					<div className="grid grid-cols-2 gap-3">
						<label>
							<span className="text-sm font-medium">Texte CTA</span>
							<input
								value={content.ctaLabel}
								onChange={(e) => setContent({ ...content, ctaLabel: e.target.value })}
								className="mt-1 block w-full rounded-md border px-3 py-2"
							/>
						</label>
						<label>
							<span className="text-sm font-medium">Lien CTA</span>
							<input
								value={content.ctaHref}
								onChange={(e) => setContent({ ...content, ctaHref: e.target.value })}
								className="mt-1 block w-full rounded-md border px-3 py-2"
							/>
						</label>
					</div>

					<label className="block">
						<span className="text-sm font-medium">URL image hero</span>
						<input
							value={content.heroImage}
							onChange={(e) => setContent({ ...content, heroImage: e.target.value })}
							className="mt-1 block w-full rounded-md border px-3 py-2"
						/>
					</label>

					<label className="block">
						<span className="text-sm font-medium">URL image bannière</span>
						<input
							value={content.bannerImage}
							onChange={(e) => setContent({ ...content, bannerImage: e.target.value })}
							className="mt-1 block w-full rounded-md border px-3 py-2"
						/>
					</label>

					<div className="flex gap-3 mt-3">
						<button onClick={save} className="px-4 py-2 bg-primary text-white rounded-md">Enregistrer</button>
						<button onClick={resetDefaults} className="px-4 py-2 border rounded-md">Réinitialiser</button>
						{status ? <span className="ml-2 text-sm text-muted">{status}</span> : null}
					</div>
				</section>

				<aside>
					<h2 className="text-lg font-semibold mb-3">Aperçu</h2>
					<div className="rounded-xl overflow-hidden border p-4 bg-white">
						<div className="mb-4">
							<img src={content.bannerImage} alt="Bannière" className="w-full h-40 object-cover rounded-md" />
						</div>
						<h3 className="text-2xl font-bold mb-2">{content.title}</h3>
						<p className="text-muted mb-4">{content.subtitle}</p>
						<a href={content.ctaHref} className="inline-block bg-primary text-white px-4 py-2 rounded-md">{content.ctaLabel}</a>
						<div className="mt-4">
							<img src={content.heroImage} alt="Hero" className="w-full h-36 object-cover rounded-md" />
						</div>
					</div>
				</aside>
			</main>
		</div>
	);
}
