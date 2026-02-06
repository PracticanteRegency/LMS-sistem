import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import styles from "./Styles/CargoNivelRegion.module.css";
import analiticaService from "../services/analitica.js";
import Perfil from "../services/perfil";
import { getUserRole, getUser } from "../services/auth";

type Cargo = {
	idcargo?: number;
	nombrecargo?: string;
	id?: number;
	nombre?: string;
};

type Nivel = {
	idnivel?: number;
	nombrenivel?: string;
	id?: number;
	nombre?: string;
};

type Regional = {
	idregional?: number;
	nombreregional?: string;
	id?: number;
	nombre?: string;
};

type Tab = "cargo" | "nivel" | "region";

export default function CargoNivelRegion() {
	const [cargosData, setCargosData] = useState<Cargo[]>([]);
	const [nivelesData, setNivelesData] = useState<Nivel[]>([]);
	const [regionalesData, setRegionalesData] = useState<Regional[]>([]);

	const [activeTab, setActiveTab] = useState<Tab>("cargo");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const [nombre, setNombre] = useState("");
	const [editId, setEditId] = useState<number | "">("");
	const [editNombre, setEditNombre] = useState("");
	const [searchFilter, setSearchFilter] = useState("");

	const effectiveRole = useMemo(() => {
		const localRole = getUserRole();
		const tokenUser: any = getUser();
		const tokenRole =
			tokenUser?.tipousuario ??
			tokenUser?.tipo_usuario ??
			tokenUser?.is_staff ??
			tokenUser?.is_admin;
		const role = Number(localRole || tokenRole || 0);
		return Number.isNaN(role) ? 0 : role;
	}, []);

	const canAccess = useMemo(() => [3, 4].includes(effectiveRole), [effectiveRole]);

	if (!canAccess) {
		return <Navigate to="/" />;
	}

	const loadAll = async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await Perfil.getCargoRegionesNiveles();

			setCargosData((data?.cargos || []) as Cargo[]);
			setNivelesData((data?.niveles || []) as Nivel[]);
			setRegionalesData((data?.regionales || []) as Regional[]);
		} catch (e: any) {
			setError(e?.response?.data?.error || "Error cargando datos");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadAll();
	}, []);

	const clearMessages = () => {
		setError(null);
		setSuccess(null);
	};

	const resetForm = () => {
		setNombre("");
		setEditId("");
		setEditNombre("");
		setSearchFilter("");
	};

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		clearMessages();

		if (!nombre.trim()) {
			setError("El nombre es obligatorio.");
			return;
		}

		setSaving(true);
		try {
			if (activeTab === "cargo") {
				await analiticaService.createCargo({ nombrecargo: nombre.trim() });
			} else if (activeTab === "nivel") {
				await analiticaService.createNivel({ nombrenivel: nombre.trim() });
			} else if (activeTab === "region") {
				await analiticaService.createRegional({ nombreregional: nombre.trim() });
			}

			resetForm();
			setSuccess(`${getLabel(activeTab)} creado correctamente.`);
			await loadAll();
		} catch (e: any) {
			setError(e?.response?.data?.error || `Error al crear ${getLabel(activeTab)}.`);
		} finally {
			setSaving(false);
		}
	};

	const handleEdit = async (e: React.FormEvent) => {
		e.preventDefault();
		clearMessages();

		if (!editId || !editNombre.trim()) {
			setError("Selecciona un registro y escribe el nuevo nombre.");
			return;
		}

		setSaving(true);
		try {
			if (activeTab === "cargo") {
				await analiticaService.updateCargo(editId as number, { nombrecargo: editNombre.trim() });
			} else if (activeTab === "nivel") {
				await analiticaService.updateNivel(editId as number, { nombrenivel: editNombre.trim() });
			} else if (activeTab === "region") {
				await analiticaService.updateRegional(editId as number, { nombreregional: editNombre.trim() });
			}

			resetForm();
			setSuccess(`${getLabel(activeTab)} actualizado correctamente.`);
			await loadAll();
		} catch (e: any) {
			setError(e?.response?.data?.error || `Error al actualizar ${getLabel(activeTab)}.`);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: number) => {
		clearMessages();

		if (!confirm(`¿Desactivar este ${getLabel(activeTab)}?`)) {
			return;
		}

		setSaving(true);
		try {
			if (activeTab === "cargo") {
				await analiticaService.deleteCargo(id);
			} else if (activeTab === "nivel") {
				await analiticaService.deleteNivel(id);
			} else if (activeTab === "region") {
				await analiticaService.deleteRegional(id);
			}

			resetForm();
			setSuccess(`${getLabel(activeTab)} desactivado correctamente.`);
			await loadAll();
		} catch (e: any) {
			setError(e?.response?.data?.error || `Error al desactivar ${getLabel(activeTab)}.`);
		} finally {
			setSaving(false);
		}
	};

	const handleSelectEdit = (id: number, nombre: string) => {
		clearMessages();
		setEditId(id);
		setEditNombre(nombre);
	};

	const getLabel = (tab: Tab): string => {
		switch (tab) {
			case "cargo":
				return "Cargo";
			case "nivel":
				return "Nivel";
			case "region":
				return "Regional";
			default:
				return "";
		}
	};

	const currentData = useMemo(() => {
		if (activeTab === "cargo") return cargosData;
		if (activeTab === "nivel") return nivelesData;
		if (activeTab === "region") return regionalesData;
		return [];
	}, [activeTab, cargosData, nivelesData, regionalesData]);

	const filteredData = useMemo(() => {
		if (!searchFilter.trim()) return currentData;

		return currentData.filter((item: any) => {
			const text = activeTab === "cargo"
				? item.nombrecargo
				: activeTab === "nivel"
					? item.nombrenivel
					: item.nombreregional;
			return text.toLowerCase().includes(searchFilter.toLowerCase());
		});
	}, [currentData, searchFilter, activeTab]);

	if (loading) {
		return (
			<div className={styles.container}>
				<div className={styles.loadingState}>
					<p>Cargando...</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<div className={styles.headerSection}>
				<h1>Gestión de Datos</h1>
				<div className={styles.tabsContainer}>
					<button
						onClick={() => {
							setActiveTab("cargo");
							resetForm();
							clearMessages();
						}}
						className={`${styles.tabButton} ${activeTab === "cargo" ? styles.active : ""}`}
					>
						Cargos
					</button>
					<button
						onClick={() => {
							setActiveTab("nivel");
							resetForm();
							clearMessages();
						}}
						className={`${styles.tabButton} ${activeTab === "nivel" ? styles.active : ""}`}
					>
						Niveles
					</button>
					<button
						onClick={() => {
							setActiveTab("region");
							resetForm();
							clearMessages();
						}}
						className={`${styles.tabButton} ${activeTab === "region" ? styles.active : ""}`}
					>
						Regionales
					</button>
				</div>
			</div>

			{error && (
				<div className={`${styles.alertContainer} ${styles.alertError}`}>
					{error}
				</div>
			)}

			{success && (
				<div className={`${styles.alertContainer} ${styles.alertSuccess}`}>
					{success}
				</div>
			)}

			<div className={styles.grid}>
				<div className={styles.card}>
					<h2>Crear {getLabel(activeTab)}</h2>
					<form className={styles.form} onSubmit={handleCreate}>
						<div className={styles.field}>
							<label>
								Nombre del {getLabel(activeTab).toLowerCase()}
								<span>*</span>
							</label>
							<input
								type="text"
								value={nombre}
								onChange={(e) => setNombre(e.target.value)}
								placeholder={`Ingresa el nombre del ${getLabel(activeTab).toLowerCase()}`}
							/>
						</div>
						<button
							type="submit"
							disabled={saving}
							className={`${styles.button} ${styles.buttonPrimary}`}
						>
							{saving ? "Guardando..." : "Crear"}
						</button>
					</form>
				</div>

				<div className={styles.card}>
					<h2>Editar {getLabel(activeTab)}</h2>
					<form className={styles.form} onSubmit={handleEdit}>
						<div className={styles.field}>
							<label>
								Selecciona un {getLabel(activeTab).toLowerCase()}
								<span>*</span>
							</label>
							<select
								value={editId}
								onChange={(e) => {
									const id = Number(e.target.value);
									const item = currentData.find((item: any) =>
										activeTab === "cargo"
											? item.idcargo === id
											: activeTab === "nivel"
												? item.idnivel === id
												: item.idregional === id
									);
									if (item) {
										handleSelectEdit(
											id,
											activeTab === "cargo"
												? (item as any).nombrecargo
												: activeTab === "nivel"
													? (item as any).nombrenivel
													: (item as any).nombreregional
										);
									}
								}}
							>
								<option value="">-- Selecciona --</option>
								{currentData.map((item: any) => (
									<option
										key={
											activeTab === "cargo"
												? item.idcargo
												: activeTab === "nivel"
													? item.idnivel
													: item.idregional
										}
										value={
											activeTab === "cargo"
												? item.idcargo
												: activeTab === "nivel"
													? item.idnivel
													: item.idregional
										}
									>
										{activeTab === "cargo"
											? item.nombrecargo
											: activeTab === "nivel"
												? item.nombrenivel
												: item.nombreregional}
									</option>
								))}
							</select>
						</div>
						<div className={styles.field}>
							<label>
								Nuevo nombre
								<span>*</span>
							</label>
							<input
								type="text"
								value={editNombre}
								onChange={(e) => setEditNombre(e.target.value)}
								placeholder={`Nuevo nombre del ${getLabel(activeTab).toLowerCase()}`}
							/>
						</div>
						<button
							type="submit"
							disabled={saving || !editId}
							className={`${styles.button} ${styles.buttonSecondary}`}
						>
							{saving ? "Guardando..." : "Actualizar"}
						</button>
					</form>
				</div>

				<div className={styles.card}>
					<h2>Listado de {getLabel(activeTab)}s</h2>
					<div className={styles.field}>
						<input
							type="text"
							value={searchFilter}
							onChange={(e) => setSearchFilter(e.target.value)}
							placeholder={`Buscar ${getLabel(activeTab).toLowerCase()}...`}
							className={styles.searchInput}
						/>
					</div>
					<div className={styles.scrollableListContainer}>
						{filteredData.length === 0 ? (
							<p className={styles.emptyState}>
								{searchFilter.trim()
									? `No hay coincidencias para "${searchFilter}"`
									: `No hay ${getLabel(activeTab).toLowerCase()}s disponibles.`}
							</p>
						) : (
							filteredData.map((item: any) => (
								<div
									key={
										activeTab === "cargo"
											? item.idcargo
											: activeTab === "nivel"
												? item.idnivel
												: item.idregional
									}
									className={styles.listItem}
								>
									<span className={styles.listItemText}>
										{activeTab === "cargo"
											? item.nombrecargo
											: activeTab === "nivel"
												? item.nombrenivel
												: item.nombreregional}
									</span>
									<button
										onClick={() =>
											handleDelete(
												activeTab === "cargo"
													? item.idcargo
													: activeTab === "nivel"
														? item.idnivel
														: item.idregional
											)
										}
										disabled={saving}
										className={`${styles.button} ${styles.buttonDanger}`}
									>
										Desactivar
									</button>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
