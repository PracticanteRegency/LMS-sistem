import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import styles from "./Styles/DatosEmpresa.module.css";
import analiticaService from "../services/analitica.js";
import { getUser, getUserRole } from "../services/auth.ts";
import Perfil from "../services/perfil";

type Proyecto = {
	idproyecto: number;
	nombreproyecto: string;
	estadoproyecto?: number;
	centros?: Centro[];
	idcolaborador?: any;
	jefe_proyecto?: {
		nombre: string;
		apellido: string;
		correo: string;
	};
};

type Centro = {
	idcentrop: number;
	nombrecentrop: string;
	estadocentrop?: number;
};

type Unidad = {
	idunidad: number;
	nombreunidad: string;
	descripcionunidad?: string;
	estadounidad?: number;
	proyectos?: Proyecto[];
};

type UnidadSelectionWithDesc = UnidadSelection & {
	nombreunidad?: string;
	descripcionunidad?: string;
};

type Empresa = {
	idempresa: number;
	nombre_empresa: string;
	nitempresa?: string;
	estadoempresa?: number;
	unidades?: Unidad[];
};

type CreateType = "empresa" | "unidad" | "proyecto" | "centro" | "";
type EditType = "empresa" | "unidad" | "proyecto" | "centro";

type UnidadSelection = {
	empresaId: number;
	unidadId: number;
};

type ProyectoSelection = {
	empresaId: number;
	unidadId: number;
	proyectoId: number;
	nombreproyecto?: string;
	nombreunidad?: string;
	descripcionunidad?: string;
};

export default function DatosEmpresa() {
	const [empresasData, setEmpresasData] = useState<Empresa[]>([]);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Selector de tipo de creación
	const [createType, setCreateType] = useState<CreateType>("");

	// Empresa
	const [empresaNombre, setEmpresaNombre] = useState("");
	const [empresaNit, setEmpresaNit] = useState("");

	// Unidad
	const [unidadNombre, setUnidadNombre] = useState("");
	const [unidadDescripcion, setUnidadDescripcion] = useState("");
	const [unidadEmpresasSeleccionadas, setUnidadEmpresasSeleccionadas] = useState<Empresa[]>([]);
	const [empresaSearch, setEmpresaSearch] = useState("");

	// Proyecto
	const [proyectoNombre, setProyectoNombre] = useState("");
	const [proyectoUnidadesSeleccionadas, setProyectoUnidadesSeleccionadas] = useState<
		UnidadSelectionWithDesc[]
	>([]);
	const [proyectoEmpresaTemp, setProyectoEmpresaTemp] = useState<number | "">("");
	const [unidadSearch, setUnidadSearch] = useState("");

	// Centro Operativo
	const [centroNombre, setCentroNombre] = useState("");
	const [centroProyectosSeleccionados, setCentroProyectosSeleccionados] = useState<
		ProyectoSelection[]
	>([]);
	const [centroEmpresaTemp, setCentroEmpresaTemp] = useState<number | "">("");
	const [centroUnidadTemp, setCentroUnidadTemp] = useState<number | "">("");
	const [proyectoSearch, setProyectoSearch] = useState("");

	// Editar
	const [editType, setEditType] = useState<EditType>("empresa");
	const [editId, setEditId] = useState<number | "">("");
	const [editNombre, setEditNombre] = useState("");
	// Cascadas para edición
	const [editEmpresaTemp, setEditEmpresaTemp] = useState<number | "">("");
	const [editUnidadTemp, setEditUnidadTemp] = useState<number | "">("");
	const [editProyectoTemp, setEditProyectoTemp] = useState<number | "">("");
	const [editEmpresaSearch, setEditEmpresaSearch] = useState("");
	const [editUnidadSearch, setEditUnidadSearch] = useState("");
	const [editProyectoSearch, setEditProyectoSearch] = useState("");

	// Jefes de Proyecto
	const [jefeProyectoMode, setJefeProyectoMode] = useState<"" | "add" | "edit" | "view">("");
	const [jefeProyectoSeleccionado, setJefeProyectoSeleccionado] = useState<number | "">("");
	const [jefeProyectoCedula, setJefeProyectoCedula] = useState("");
	const [jefeProyectoSearchResults, setJefeProyectoSearchResults] = useState<any[]>([]);
	const [jefeProyectoActual, setJefeProyectoActual] = useState<any>(null);
	const [jefeProyectoColaboradorSeleccionado, setJefeProyectoColaboradorSeleccionado] = useState<any>(null);

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

	const canAccess = useMemo(() => [1, 3, 4].includes(effectiveRole), [effectiveRole]);

	const loadAll = async () => {
		setLoading(true);
		setError(null);
		try {
			const empresasResp = await analiticaService.getEmpresas();
			setEmpresasData(empresasResp?.empresas || []);
		} catch (e: any) {
			setError(e?.response?.data?.error || "Error cargando datos");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadAll();
	}, []);

	// Extraer listas planas para edición
	const empresasList = useMemo(() => empresasData, [empresasData]);

	const clearMessages = () => {
		setError(null);
		setSuccess(null);
	};

	const resetCreateForm = () => {
		setEmpresaNombre("");
		setEmpresaNit("");
		setUnidadNombre("");
		setUnidadDescripcion("");
		setUnidadEmpresasSeleccionadas([]);
		setEmpresaSearch("");
		setProyectoNombre("");
		setProyectoUnidadesSeleccionadas([]);
		setProyectoEmpresaTemp("");
		setUnidadSearch("");
		setCentroNombre("");
		setCentroProyectosSeleccionados([]);
		setCentroEmpresaTemp("");
		setCentroUnidadTemp("");
		setProyectoSearch("");
		setEditId("");
		setEditNombre("");
		setEditEmpresaTemp("");
		setEditUnidadTemp("");
		setEditProyectoTemp("");
		setEditEmpresaSearch("");
		setEditUnidadSearch("");
		setEditProyectoSearch("");
	};

	const handleCreateEmpresa = async (e: React.FormEvent) => {
		e.preventDefault();
		clearMessages();
		if (!empresaNombre.trim()) {
			setError("El nombre de la empresa es obligatorio.");
			return;
		}
		setSaving(true);
		try {
			await analiticaService.createEmpresa({
				nombre_empresa: empresaNombre.trim(),
				nitempresa: empresaNit.trim() || "0",
				estadoempresa: 1,
			});
			resetCreateForm();
			setSuccess("Empresa creada correctamente.");
			await loadAll();
		} catch (e: any) {
			setError(e?.response?.data?.error || "Error al crear empresa.");
		} finally {
			setSaving(false);
		}
	};

	const handleCreateUnidad = async (e: React.FormEvent) => {
		e.preventDefault();
		clearMessages();
		if (!unidadNombre.trim()) {
			setError("El nombre de la unidad es obligatorio.");
			return;
		}
		if (unidadEmpresasSeleccionadas.length === 0) {
			setError("Debes seleccionar al menos una empresa.");
			return;
		}
		setSaving(true);
		try {
			await Promise.all(
				unidadEmpresasSeleccionadas.map((emp) =>
					analiticaService.createUnidad({
						nombreunidad: unidadNombre.trim(),
						descripcionunidad: unidadDescripcion.trim() || unidadNombre.trim(),
						estadounidad: 1,
						id_empresa: emp.idempresa,
					})
				)
			);
			resetCreateForm();
			setSuccess("Unidad creada correctamente.");
			await loadAll();
		} catch (e: any) {
			setError(e?.response?.data?.error || "Error al crear unidad.");
		} finally {
			setSaving(false);
		}
	};

	const handleRemoveProyectoUnidad = (index: number) => {
		setProyectoUnidadesSeleccionadas(proyectoUnidadesSeleccionadas.filter((_, i) => i !== index));
	};

	const handleCreateProyecto = async (e: React.FormEvent) => {
		e.preventDefault();
		clearMessages();
		if (!proyectoNombre.trim()) {
			setError("El nombre del proyecto es obligatorio.");
			return;
		}
		if (proyectoUnidadesSeleccionadas.length === 0) {
			setError("Debes agregar al menos una unidad.");
			return;
		}
		setSaving(true);
		try {
			await Promise.all(
				proyectoUnidadesSeleccionadas.map((sel) =>
					analiticaService.createProyecto({
						nombreproyecto: proyectoNombre.trim(),
						estadoproyecto: 1,
						id_unidad: sel.unidadId,
					})
				)
			);
			resetCreateForm();
			setSuccess("Proyecto creado correctamente.");
			await loadAll();
		} catch (e: any) {
			setError(e?.response?.data?.error || "Error al crear proyecto.");
		} finally {
			setSaving(false);
		}
	};

	const handleRemoveCentroProyecto = (index: number) => {
		setCentroProyectosSeleccionados(centroProyectosSeleccionados.filter((_, i) => i !== index));
	};

	const handleCreateCentro = async (e: React.FormEvent) => {
		e.preventDefault();
		clearMessages();
		if (!centroNombre.trim()) {
			setError("El nombre del centro operativo es obligatorio.");
			return;
		}
		if (centroProyectosSeleccionados.length === 0) {
			setError("Debes agregar al menos un proyecto.");
			return;
		}
		setSaving(true);
		try {
			await Promise.all(
				centroProyectosSeleccionados.map((sel) =>
					analiticaService.createCentro({
						nombrecentrop: centroNombre.trim(),
						estadocentrop: 1,
						id_proyecto: sel.proyectoId,
					})
				)
			);
			resetCreateForm();
			setSuccess("Centro operativo creado correctamente.");
			await loadAll();
		} catch (e: any) {
			setError(e?.response?.data?.error || "Error al crear centro operativo.");
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
			if (editType === "empresa") {
				await analiticaService.updateEmpresa(editId, { nombre_empresa: editNombre.trim() });
			} else if (editType === "unidad") {
				await analiticaService.updateUnidad(editId, { nombreunidad: editNombre.trim() });
			} else if (editType === "proyecto") {
				await analiticaService.updateProyecto(editId, { nombreproyecto: editNombre.trim() });
			} else {
				await analiticaService.updateCentro(editId, { nombrecentrop: editNombre.trim() });
			}
			setEditId("");
			setEditNombre("");
			setSuccess("Nombre actualizado correctamente.");
			await loadAll();
		} catch (e: any) {
			setError(e?.response?.data?.error || "Error al actualizar.");
		} finally {
			setSaving(false);
		}
	};

	// Obtener unidades de una empresa seleccionada
	const getUnidadesByEmpresa = (empresaId: number | "") => {
		if (!empresaId) return [];
		const empresa = empresasData.find((e) => e.idempresa === empresaId);
		return empresa?.unidades || [];
	};

	// Obtener proyectos de una unidad seleccionada
	const getProyectosByUnidad = (empresaId: number | "", unidadId: number | "") => {
		if (!empresaId || !unidadId) return [];
		const empresa = empresasData.find((e) => e.idempresa === empresaId);
		const unidad = empresa?.unidades?.find((u) => u.idunidad === unidadId);
		return unidad?.proyectos || [];
	};

	// Obtener nombre de empresa
	const getEmpresaNombre = (empresaId: number) => {
		return empresasData.find((e) => e.idempresa === empresaId)?.nombre_empresa || "";
	};

	// Obtener nombre de unidad
	const getUnidadNombre = (empresaId: number, unidadId: number) => {
		const empresa = empresasData.find((e) => e.idempresa === empresaId);
		return empresa?.unidades?.find((u) => u.idunidad === unidadId)?.nombreunidad || "";
	};

	// Obtener descripción de unidad
	const getUnidadDescripcion = (empresaId: number, unidadId: number) => {
		const empresa = empresasData.find((e) => e.idempresa === empresaId);
		return empresa?.unidades?.find((u) => u.idunidad === unidadId)?.descripcionunidad || "";
	};

	// Obtener datos completos de un proyecto (incluyendo unidad)
	const getProyectoConUnidad = (proyectoId: number) => {
		for (const empresa of empresasData) {
			for (const unidad of empresa.unidades || []) {
				const proyecto = unidad.proyectos?.find((p) => p.idproyecto === proyectoId);
				if (proyecto) {
					return {
						proyecto,
						unidad,
						empresa
					};
				}
			}
		}
		return null;
	};

	// Funciones para Jefes de Proyecto
	const handleBuscarColaboradorJefe = async (cedula: string) => {
		if (!cedula.trim()) {
			setJefeProyectoSearchResults([]);
			return;
		}
		try {
			const results = await Perfil.getFiltrarUsuarios(cedula, 1, 10);
			const usuarios = Array.isArray(results) ? results : results?.results || [];
			setJefeProyectoSearchResults(usuarios);
		} catch (error) {
			console.error("Error buscando colaborador:", error);
			setError("Error al buscar colaborador.");
		}
	};

	const handleSeleccionarColaboradorJefe = (colaborador: any) => {
		setJefeProyectoColaboradorSeleccionado(colaborador);
		setJefeProyectoCedula("");
		setJefeProyectoSearchResults([]);
	};

	const handleAgregarJefe = async () => {
		clearMessages();
		if (!jefeProyectoSeleccionado) {
			setError("Debes seleccionar un proyecto.");
			return;
		}
		if (!jefeProyectoColaboradorSeleccionado) {
			setError("Debes seleccionar un colaborador.");
			return;
		}

		setSaving(true);
		try {
			await analiticaService.assignJefeProyecto(
				jefeProyectoSeleccionado as number,
				jefeProyectoColaboradorSeleccionado.id_colaborador
			);
			setSuccess("Jefe de proyecto asignado correctamente.");
			setJefeProyectoMode("");
			setJefeProyectoSeleccionado("");
			setJefeProyectoColaboradorSeleccionado(null);
			await loadAll();
		} catch (error: any) {
			setError(error?.response?.data?.error || "Error al asignar jefe de proyecto.");
		} finally {
			setSaving(false);
		}
	};

	const handleActualizarJefe = async () => {
		clearMessages();
		if (!jefeProyectoSeleccionado) {
			setError("Debes seleccionar un proyecto.");
			return;
		}
		if (!jefeProyectoColaboradorSeleccionado) {
			setError("Debes seleccionar un colaborador.");
			return;
		}

		setSaving(true);
		try {
			await analiticaService.updateJefeProyecto(
				jefeProyectoSeleccionado as number,
				jefeProyectoColaboradorSeleccionado.id_colaborador
			);
			setSuccess("Jefe de proyecto actualizado correctamente.");
			setJefeProyectoMode("");
			setJefeProyectoSeleccionado("");
			setJefeProyectoColaboradorSeleccionado(null);
			await loadAll();
		} catch (error: any) {
			setError(error?.response?.data?.error || "Error al actualizar jefe de proyecto.");
		} finally {
			setSaving(false);
		}
	};

	const handleEliminarJefe = async (proyectoId: number) => {
		if (!confirm("¿Estás seguro de que deseas remover el jefe de este proyecto?")) {
			return;
		}

		setSaving(true);
		try {
			await analiticaService.removeJefeProyecto(proyectoId);
			setSuccess("Jefe del proyecto removido correctamente.");
			await loadAll();
		} catch (error: any) {
			setError(error?.response?.data?.error || "Error al remover jefe de proyecto.");
		} finally {
			setSaving(false);
		}
	};

	const resetJefeProyectoForm = () => {
		setJefeProyectoMode("");
		setJefeProyectoSeleccionado("");
		setJefeProyectoCedula("");
		setJefeProyectoSearchResults([]);
		setJefeProyectoActual(null);
		setJefeProyectoColaboradorSeleccionado(null);
	};

	if (!canAccess) {
		return <Navigate to="/no-autorizado" replace />;
	}

	return (
		<div className={styles.container}>
			<div className={styles.card}>
				<h2 className={styles.title}>Gestión de Empresas y Estructura</h2>
				{loading && <p className={styles.info}>Cargando datos...</p>}
				{error && <p className={styles.error}>{error}</p>}
				{success && <p className={styles.success}>{success}</p>}
			</div>

			{/* Selector de tipo de creación */}
			<div className={styles.card}>
				<h3>¿Qué deseas crear?</h3>
				<div className={styles.typeSelector}>
					<button
						type="button"
						className={`${styles.typeButton} ${createType === "empresa" ? styles.active : ""}`}
						onClick={() => {
							setCreateType("empresa");
							resetCreateForm();
							clearMessages();
						}}
					>
						Empresa
					</button>
					<button
						type="button"
						className={`${styles.typeButton} ${createType === "unidad" ? styles.active : ""}`}
						onClick={() => {
							setCreateType("unidad");
							resetCreateForm();
							clearMessages();
						}}
					>
						Unidad
					</button>
					<button
						type="button"
						className={`${styles.typeButton} ${createType === "proyecto" ? styles.active : ""}`}
						onClick={() => {
							setCreateType("proyecto");
							resetCreateForm();
							clearMessages();
						}}
					>
						Proyecto
					</button>
					<button
						type="button"
						className={`${styles.typeButton} ${createType === "centro" ? styles.active : ""}`}
						onClick={() => {
							setCreateType("centro");
							resetCreateForm();
							clearMessages();
						}}
					>
						Centro Operativo
					</button>
				</div>
			</div>

			{/* Formulario de Empresa */}
			{createType === "empresa" && (
				<form className={styles.card} onSubmit={handleCreateEmpresa}>
					<h3>Crear Empresa</h3>
					<label>Nombre</label>
					<input
						className={styles.input}
						value={empresaNombre}
						onChange={(e) => setEmpresaNombre(e.target.value)}
						placeholder="Nombre de la empresa"
					/>
					<label>NIT (opcional)</label>
					<input
						className={styles.input}
						value={empresaNit}
						onChange={(e) => setEmpresaNit(e.target.value)}
						placeholder="NIT"
					/>
					<button className={styles.button} type="submit" disabled={saving}>
						Crear Empresa
					</button>
				</form>
			)}

			{/* Formulario de Unidad */}
			{createType === "unidad" && (
				<form className={styles.card} onSubmit={handleCreateUnidad}>
					<h3>Crear Unidad</h3>
					<label>Nombre</label>
					<input
						className={styles.input}
						value={unidadNombre}
						onChange={(e) => setUnidadNombre(e.target.value)}
						placeholder="Nombre de la unidad"
					/>
					<label>Descripción</label>
					<input
						className={styles.input}
						value={unidadDescripcion}
						onChange={(e) => setUnidadDescripcion(e.target.value)}
						placeholder="Descripción (opcional)"
					/>
					
					<div className={styles.searchPanel}>
						<div className={styles.searchHeader}>
							<h4>Seleccionar Empresas</h4>
							<p className={styles.smallNote}>Busca y agrega empresas para esta unidad.</p>
						</div>
						<input
							type="text"
							placeholder="Buscar empresa por nombre"
							value={empresaSearch}
							onChange={(e) => setEmpresaSearch(e.target.value)}
							className={styles.searchInput}
						/>
						<div className={styles.searchResults}>
							{empresasList
								.filter((emp) => 
									emp.nombre_empresa.toLowerCase().includes(empresaSearch.toLowerCase()) && 
									!unidadEmpresasSeleccionadas.some((sel) => sel.idempresa === emp.idempresa)
								)
								.slice(0, 8)
								.map((emp) => (
									<button
										key={emp.idempresa}
										type="button"
										className={styles.addButton}
										onClick={() => setUnidadEmpresasSeleccionadas([...unidadEmpresasSeleccionadas, emp])}
									>
										➕ {emp.nombre_empresa}
									</button>
								))}
							{empresasList.filter((emp) => 
								emp.nombre_empresa.toLowerCase().includes(empresaSearch.toLowerCase()) && 
								!unidadEmpresasSeleccionadas.some((sel) => sel.idempresa === emp.idempresa)
							).length === 0 && (
								<p className={styles.smallNote}>No hay resultados o ya fueron agregadas.</p>
							)}
						</div>
						{unidadEmpresasSeleccionadas.length > 0 && (
							<div className={styles.previewSection}>
								<h4>Empresas seleccionadas</h4>
								<ul className={styles.examenList}>
									{unidadEmpresasSeleccionadas.map((emp) => (
										<li key={emp.idempresa}>
											✓ {emp.nombre_empresa}
											<button
												type="button"
												className={styles.removeButtonInline}
												onClick={() => setUnidadEmpresasSeleccionadas(
													unidadEmpresasSeleccionadas.filter((e) => e.idempresa !== emp.idempresa)
												)}
											>
												Quitar
											</button>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
					
					<small className={styles.hint}>Se creará una unidad por cada empresa seleccionada.</small>
					<button className={styles.button} type="submit" disabled={saving}>
						Crear Unidad
					</button>
				</form>
			)}

			{/* Formulario de Proyecto */}
			{createType === "proyecto" && (
				<form className={styles.card} onSubmit={handleCreateProyecto}>
					<h3>Crear Proyecto</h3>
					<label>Nombre</label>
					<input
						className={styles.input}
						value={proyectoNombre}
						onChange={(e) => setProyectoNombre(e.target.value)}
						placeholder="Nombre del proyecto"
					/>

					<div className={styles.searchPanel}>
						<div className={styles.searchHeader}>
							<h4>Agregar Unidades</h4>
							<p className={styles.smallNote}>Selecciona empresa y luego busca unidades para agregar.</p>
						</div>
						<div className={styles.field}>
							<label>Empresa</label>
							<select
								className={styles.select}
								value={proyectoEmpresaTemp}
								onChange={(e) => {
									setProyectoEmpresaTemp(Number(e.target.value) || "");
									setUnidadSearch("");
								}}
							>
								<option value="">Seleccione una empresa</option>
								{empresasList.map((e) => (
									<option key={e.idempresa} value={e.idempresa}>
										{e.nombre_empresa}
									</option>
								))}
							</select>
						</div>
						
						{proyectoEmpresaTemp && (
							<>
								<input
									type="text"
									placeholder="Buscar unidad por nombre"
									value={unidadSearch}
									onChange={(e) => setUnidadSearch(e.target.value)}
									className={styles.searchInput}
								/>
								<div className={styles.searchResults}>
									{getUnidadesByEmpresa(proyectoEmpresaTemp)
										.filter((u) => 
											u.nombreunidad.toLowerCase().includes(unidadSearch.toLowerCase()) &&
											!proyectoUnidadesSeleccionadas.some((sel) => 
												sel.empresaId === proyectoEmpresaTemp && sel.unidadId === u.idunidad
											)
										)
										.slice(0, 8)
										.map((u) => (
											<button
												key={u.idunidad}
												type="button"
												className={styles.addButton}
												onClick={() => {
													setProyectoUnidadesSeleccionadas([
														...proyectoUnidadesSeleccionadas,
														{ 
															empresaId: proyectoEmpresaTemp as number, 
															unidadId: u.idunidad,
															nombreunidad: u.nombreunidad,
															descripcionunidad: u.descripcionunidad
														}
													]);
													clearMessages();
												}}
											>
												<div>
													➕ {u.nombreunidad}
													{u.descripcionunidad && (
														<div style={{ fontSize: "0.85em", color: "#555", marginTop: "4px" }}>
															📝 {u.descripcionunidad}
														</div>
													)}
												</div>
											</button>
										))}
									{getUnidadesByEmpresa(proyectoEmpresaTemp).filter((u) => 
										u.nombreunidad.toLowerCase().includes(unidadSearch.toLowerCase()) &&
										!proyectoUnidadesSeleccionadas.some((sel) => 
											sel.empresaId === proyectoEmpresaTemp && sel.unidadId === u.idunidad
										)
									).length === 0 && (
										<p className={styles.smallNote}>No hay resultados o ya fueron agregadas.</p>
									)}
								</div>
							</>
						)}
						
						{proyectoUnidadesSeleccionadas.length > 0 && (
							<div className={styles.previewSection}>
								<h4>Unidades seleccionadas</h4>
								<ul className={styles.examenList}>
									{proyectoUnidadesSeleccionadas.map((sel, idx) => (
										<li key={idx}>
											<div>
												✓ {getEmpresaNombre(sel.empresaId)} → {sel.nombreunidad}
												{sel.descripcionunidad && (
													<div style={{ fontSize: "0.85em", color: "#666", marginTop: "4px" }}>
														📝 {sel.descripcionunidad}
													</div>
												)}
											</div>
											<button
												type="button"
												className={styles.removeButtonInline}
												onClick={() => handleRemoveProyectoUnidad(idx)}
											>
												Quitar
											</button>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>

					<button className={styles.button} type="submit" disabled={saving}>
						Crear Proyecto
					</button>
				</form>
			)}

			{/* Formulario de Centro Operativo */}
			{createType === "centro" && (
				<form className={styles.card} onSubmit={handleCreateCentro}>
					<h3>Crear Centro Operativo</h3>
					<label>Nombre</label>
					<input
						className={styles.input}
						value={centroNombre}
						onChange={(e) => setCentroNombre(e.target.value)}
						placeholder="Nombre del centro operativo"
					/>

					<div className={styles.searchPanel}>
						<div className={styles.searchHeader}>
							<h4>Agregar Proyectos</h4>
							<p className={styles.smallNote}>Selecciona empresa y unidad, luego busca proyectos.</p>
						</div>
						<div className={styles.row}>
							<div className={styles.field}>
								<label>Empresa</label>
								<select
									className={styles.select}
									value={centroEmpresaTemp}
									onChange={(e) => {
										setCentroEmpresaTemp(Number(e.target.value) || "");
										setCentroUnidadTemp("");
										setProyectoSearch("");
									}}
								>
									<option value="">Seleccione una empresa</option>
									{empresasList.map((e) => (
										<option key={e.idempresa} value={e.idempresa}>
											{e.nombre_empresa}
										</option>
									))}
								</select>
							</div>
							<div className={styles.field}>
								<label>Unidad</label>
								<select
									className={styles.select}
									value={centroUnidadTemp}
									onChange={(e) => {
										setCentroUnidadTemp(Number(e.target.value) || "");
										setProyectoSearch("");
									}}
									disabled={!centroEmpresaTemp}
								>
									<option value="">Seleccione una unidad</option>
									{getUnidadesByEmpresa(centroEmpresaTemp).map((u) => (
										<option key={u.idunidad} value={u.idunidad}>
											{u.nombreunidad}
										</option>
									))}
								</select>
							</div>
						</div>
						
						{centroUnidadTemp && (
							<>
								<input
									type="text"
									placeholder="Buscar proyecto por nombre"
									value={proyectoSearch}
									onChange={(e) => setProyectoSearch(e.target.value)}
									className={styles.searchInput}
								/>
								<div className={styles.searchResults}>
									{getProyectosByUnidad(centroEmpresaTemp, centroUnidadTemp)
										.filter((p) => 
											p.nombreproyecto.toLowerCase().includes(proyectoSearch.toLowerCase()) &&
											!centroProyectosSeleccionados.some((sel) => 
												sel.empresaId === centroEmpresaTemp && 
												sel.unidadId === centroUnidadTemp && 
												sel.proyectoId === p.idproyecto
											)
										)
										.slice(0, 8)
										.map((p) => {
											const desc = getUnidadDescripcion(centroEmpresaTemp as number, centroUnidadTemp as number);
											return (
												<button
													key={p.idproyecto}
													type="button"
													className={styles.addButton}
													onClick={() => {
														setCentroProyectosSeleccionados([
															...centroProyectosSeleccionados,
															{
																empresaId: centroEmpresaTemp as number,
																unidadId: centroUnidadTemp as number,
																proyectoId: p.idproyecto,
																nombreproyecto: p.nombreproyecto,
																nombreunidad: getUnidadNombre(centroEmpresaTemp as number, centroUnidadTemp as number),
																descripcionunidad: desc
															}
														]);
														clearMessages();
													}}
												>
													<div>
														➕ {p.nombreproyecto}
														{desc && (
															<div style={{ fontSize: "0.85em", color: "#555", marginTop: "4px" }}>
																📝 Unidad: {desc}
															</div>
														)}
													</div>
												</button>
											);
										})}
									{getProyectosByUnidad(centroEmpresaTemp, centroUnidadTemp).filter((p) => 
										p.nombreproyecto.toLowerCase().includes(proyectoSearch.toLowerCase()) &&
										!centroProyectosSeleccionados.some((sel) => 
											sel.empresaId === centroEmpresaTemp && 
											sel.unidadId === centroUnidadTemp && 
											sel.proyectoId === p.idproyecto
										)
									).length === 0 && (
										<p className={styles.smallNote}>No hay resultados o ya fueron agregados.</p>
									)}
								</div>
							</>
						)}
						
						{centroProyectosSeleccionados.length > 0 && (
							<div className={styles.previewSection}>
								<h4>Proyectos seleccionados</h4>
								<ul className={styles.examenList}>
									{centroProyectosSeleccionados.map((sel, idx) => (
										<li key={idx}>
											<div>
												✓ {getEmpresaNombre(sel.empresaId)} → {sel.nombreunidad} → {sel.nombreproyecto}
												{sel.descripcionunidad && (
													<div style={{ fontSize: "0.85em", color: "#666", marginTop: "4px" }}>
														📝 {sel.descripcionunidad}
													</div>
												)}
											</div>
											<button
												type="button"
												className={styles.removeButtonInline}
												onClick={() => handleRemoveCentroProyecto(idx)}
											>
												Quitar
											</button>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>

					<button className={styles.button} type="submit" disabled={saving}>
						Crear Centro Operativo
					</button>
				</form>
			)}

			{/* Formulario de Edición */}
			<form className={styles.card} onSubmit={handleEdit}>
				<h3>Editar Nombre</h3>
				<div className={styles.row}>
					<div className={styles.field}>
						<label>Tipo</label>
						<select
							className={styles.select}
							value={editType}
							onChange={(e) => {
								setEditType(e.target.value as EditType);
								setEditId("");
								setEditNombre("");
							setEditEmpresaTemp("");
							setEditUnidadTemp("");
							setEditProyectoTemp("");
							setEditEmpresaSearch("");
							setEditUnidadSearch("");
							setEditProyectoSearch("");
							}}
						>
							<option value="empresa">Empresa</option>
							<option value="unidad">Unidad</option>
							<option value="proyecto">Proyecto</option>
							<option value="centro">Centro Operativo</option>
						</select>
					</div>
					<div className={styles.field}>
						<label>Nuevo nombre</label>
						<input
							className={styles.input}
							value={editNombre}
							onChange={(e) => setEditNombre(e.target.value)}
							placeholder="Nuevo nombre"
							disabled={!editId}
						/>
					</div>
				</div>

{/* Para Empresa */}
			{editType === "empresa" && (
				<div className={styles.searchPanel}>
					<div className={styles.searchHeader}>
						<h4>Seleccionar Empresa</h4>
						<p className={styles.smallNote}>Busca la empresa que deseas editar.</p>
					</div>
					<input
						type="text"
						placeholder="Buscar empresa"
						value={editEmpresaSearch}
						onChange={(e) => setEditEmpresaSearch(e.target.value)}
						className={styles.searchInput}
					/>
					<div className={styles.searchResults}>
						{empresasList
							.filter((e) => e.nombre_empresa.toLowerCase().includes(editEmpresaSearch.toLowerCase()))
							.slice(0, 8)
							.map((e) => (
								<button
									key={e.idempresa}
									type="button"
									className={`${styles.addButton} ${editId === e.idempresa ? styles.selectedButton : ""}`}
									onClick={() => {
										setEditId(e.idempresa);
										setEditEmpresaSearch("");
										clearMessages();
									}}
								>
									{editId === e.idempresa ? "✓ " : ""}
									{e.nombre_empresa}
								</button>
							))}
						{empresasList.filter((e) => e.nombre_empresa.toLowerCase().includes(editEmpresaSearch.toLowerCase())).length === 0 && (
							<p className={styles.smallNote}>No hay resultados.</p>
						)}
					</div>
				</div>
			)}

			{/* Para Unidad */}
			{editType === "unidad" && (
				<div className={styles.searchPanel}>
					<div className={styles.searchHeader}>
						<h4>Seleccionar Unidad</h4>
						<p className={styles.smallNote}>Selecciona empresa y luego la unidad a editar.</p>
					</div>
					
					<div className={styles.field}>
						<label>Empresa</label>
						<select
							className={styles.select}
							value={editEmpresaTemp}
							onChange={(e) => {
								setEditEmpresaTemp(Number(e.target.value) || "");
								setEditUnidadTemp("");
								setEditUnidadSearch("");
								setEditId("");
								setEditNombre("");
							}}
						>
							<option value="">Seleccione una empresa</option>
							{empresasList.map((e) => (
								<option key={e.idempresa} value={e.idempresa}>
									{e.nombre_empresa}
								</option>
							))}
						</select>
					</div>

					{editEmpresaTemp && (
						<>
							<input
								type="text"
								placeholder="Buscar unidad"
								value={editUnidadSearch}
								onChange={(e) => setEditUnidadSearch(e.target.value)}
								className={styles.searchInput}
							/>
							<div className={styles.searchResults}>
								{getUnidadesByEmpresa(editEmpresaTemp)
									.filter((u) => u.nombreunidad.toLowerCase().includes(editUnidadSearch.toLowerCase()))
									.slice(0, 8)
									.map((u) => (
										<button
											key={u.idunidad}
											type="button"
											className={`${styles.addButton} ${editId === u.idunidad ? styles.selectedButton : ""}`}
											onClick={() => {
												setEditId(u.idunidad);
												setEditUnidadSearch("");
												clearMessages();
											}}
										>
											<div>
												{editId === u.idunidad ? "✓ " : ""}
												{u.nombreunidad}
												{u.descripcionunidad && (
													<div style={{ fontSize: "0.85em", color: "#555", marginTop: "4px" }}>
														📝 {u.descripcionunidad}
													</div>
												)}
											</div>
										</button>
									))}
								{getUnidadesByEmpresa(editEmpresaTemp).filter((u) => u.nombreunidad.toLowerCase().includes(editUnidadSearch.toLowerCase())).length === 0 && (
									<p className={styles.smallNote}>No hay resultados.</p>
								)}
							</div>
						</>
					)}
				</div>
			)}

			{/* Para Proyecto */}
			{editType === "proyecto" && (
				<div className={styles.searchPanel}>
					<div className={styles.searchHeader}>
						<h4>Seleccionar Proyecto</h4>
						<p className={styles.smallNote}>Selecciona empresa, unidad y luego el proyecto a editar.</p>
					</div>
					
					<div className={styles.row}>
						<div className={styles.field}>
							<label>Empresa</label>
							<select
								className={styles.select}
								value={editEmpresaTemp}
								onChange={(e) => {
									setEditEmpresaTemp(Number(e.target.value) || "");
									setEditUnidadTemp("");
									setEditProyectoTemp("");
									setEditProyectoSearch("");
									setEditId("");
									setEditNombre("");
								}}
							>
								<option value="">Seleccione una empresa</option>
								{empresasList.map((e) => (
									<option key={e.idempresa} value={e.idempresa}>
										{e.nombre_empresa}
									</option>
								))}
							</select>
						</div>
						<div className={styles.field}>
							<label>Unidad</label>
							<select
								className={styles.select}
								value={editUnidadTemp}
								onChange={(e) => {
									setEditUnidadTemp(Number(e.target.value) || "");
									setEditProyectoTemp("");
									setEditProyectoSearch("");
									setEditId("");
									setEditNombre("");
								}}
								disabled={!editEmpresaTemp}
							>
								<option value="">Seleccione una unidad</option>
								{getUnidadesByEmpresa(editEmpresaTemp).map((u) => (
									<option key={u.idunidad} value={u.idunidad}>
										{u.nombreunidad}
									</option>
								))}
							</select>
						</div>
					</div>

					{editUnidadTemp && (
						<>
							<input
								type="text"
								placeholder="Buscar proyecto"
								value={editProyectoSearch}
								onChange={(e) => setEditProyectoSearch(e.target.value)}
								className={styles.searchInput}
							/>
							<div className={styles.searchResults}>
								{getProyectosByUnidad(editEmpresaTemp, editUnidadTemp)
									.filter((p) => p.nombreproyecto.toLowerCase().includes(editProyectoSearch.toLowerCase()))
									.slice(0, 8)
									.map((p) => {
										const desc = getUnidadDescripcion(editEmpresaTemp as number, editUnidadTemp as number);
										return (
											<button
												key={p.idproyecto}
												type="button"
												className={`${styles.addButton} ${editId === p.idproyecto ? styles.selectedButton : ""}`}
												onClick={() => {
													setEditId(p.idproyecto);
													setEditProyectoSearch("");
													clearMessages();
												}}
											>
												<div>
													{editId === p.idproyecto ? "✓ " : ""}
													{p.nombreproyecto}
													{desc && (
														<div style={{ fontSize: "0.85em", color: "#555", marginTop: "4px" }}>
															📝 Unidad: {desc}
														</div>
													)}
												</div>
											</button>
										);
									})}
								{getProyectosByUnidad(editEmpresaTemp, editUnidadTemp).filter((p) => p.nombreproyecto.toLowerCase().includes(editProyectoSearch.toLowerCase())).length === 0 && (
									<p className={styles.smallNote}>No hay resultados.</p>
								)}
							</div>
						</>
					)}
				</div>
			)}

			{/* Para Centro Operativo */}
			{editType === "centro" && (
				<div className={styles.searchPanel}>
					<div className={styles.searchHeader}>
						<h4>Seleccionar Centro Operativo</h4>
						<p className={styles.smallNote}>Selecciona empresa, unidad, proyecto y luego el centro a editar.</p>
					</div>
					
					<div className={styles.row}>
						<div className={styles.field}>
							<label>Empresa</label>
							<select
								className={styles.select}
								value={editEmpresaTemp}
								onChange={(e) => {
									setEditEmpresaTemp(Number(e.target.value) || "");
									setEditUnidadTemp("");
									setEditProyectoTemp("");
									setEditProyectoSearch("");
									setEditId("");
									setEditNombre("");
								}}
							>
								<option value="">Seleccione una empresa</option>
								{empresasList.map((e) => (
									<option key={e.idempresa} value={e.idempresa}>
										{e.nombre_empresa}
									</option>
								))}
							</select>
						</div>
						<div className={styles.field}>
							<label>Unidad</label>
							<select
								className={styles.select}
								value={editUnidadTemp}
								onChange={(e) => {
									setEditUnidadTemp(Number(e.target.value) || "");
									setEditProyectoTemp("");
									setEditProyectoSearch("");
									setEditId("");
									setEditNombre("");
								}}
								disabled={!editEmpresaTemp}
							>
								<option value="">Seleccione una unidad</option>
								{getUnidadesByEmpresa(editEmpresaTemp).map((u) => (
									<option key={u.idunidad} value={u.idunidad}>
										{u.nombreunidad}
									</option>
								))}
							</select>
						</div>
						<div className={styles.field}>
							<label>Proyecto</label>
							<select
								className={styles.select}
								value={editProyectoTemp}
								onChange={(e) => {
									setEditProyectoTemp(Number(e.target.value) || "");
									setEditId("");
									setEditNombre("");
								}}
								disabled={!editUnidadTemp}
							>
								<option value="">Seleccione un proyecto</option>
								{getProyectosByUnidad(editEmpresaTemp, editUnidadTemp).map((p) => (
									<option key={p.idproyecto} value={p.idproyecto}>
										{p.nombreproyecto}
									</option>
								))}
							</select>
						</div>
					</div>

					{editProyectoTemp && (
						<>
							<input
								type="text"
								placeholder="Buscar centro operativo"
								value={editProyectoSearch}
								onChange={(e) => setEditProyectoSearch(e.target.value)}
								className={styles.searchInput}
							/>
							<div className={styles.searchResults}>
								{getProyectosByUnidad(editEmpresaTemp, editUnidadTemp)
									.find((p) => p.idproyecto === editProyectoTemp)
									?.centros?.filter((c) => c.nombrecentrop.toLowerCase().includes(editProyectoSearch.toLowerCase()))
									?.slice(0, 8)
									.map((c) => (
										<button
											key={c.idcentrop}
											type="button"
											className={`${styles.addButton} ${editId === c.idcentrop ? styles.selectedButton : ""}`}
											onClick={() => {
												setEditId(c.idcentrop);
												setEditProyectoSearch("");
												clearMessages();
											}}
										>
											{editId === c.idcentrop ? "✓ " : ""}
											{c.nombrecentrop}
										</button>
									)) || []}
								{(!getProyectosByUnidad(editEmpresaTemp, editUnidadTemp).find((p) => p.idproyecto === editProyectoTemp)?.centros || 
									getProyectosByUnidad(editEmpresaTemp, editUnidadTemp)
										.find((p) => p.idproyecto === editProyectoTemp)
										?.centros?.filter((c) => c.nombrecentrop.toLowerCase().includes(editProyectoSearch.toLowerCase())).length === 0) && (
									<p className={styles.smallNote}>No hay resultados.</p>
								)}
							</div>
						</>
					)}
				</div>
			)}

				<button className={styles.button} type="submit" disabled={saving || !editId || !editNombre.trim()}>
					Guardar cambios
				</button>
			</form>

		{/* ============================
			 JEFES DE PROYECTO
		     ============================ */}
		<div className={styles.card}>
			<h2 className={styles.title}>Gestión de Jefes de Proyecto</h2>
			
			{/* Panel de selección de modo */}
			<div className={styles.row} style={{ marginBottom: "20px" }}>
				<button
					type="button"
					className={`${styles.button} ${jefeProyectoMode === "add" ? styles.buttonActive : ""}`}
					onClick={() => {
						resetJefeProyectoForm();
						setJefeProyectoMode("add");
					}}
				>
					➕ Agregar Jefe
				</button>
				<button
					type="button"
					className={`${styles.button} ${jefeProyectoMode === "edit" ? styles.buttonActive : ""}`}
					onClick={() => {
						resetJefeProyectoForm();
						setJefeProyectoMode("edit");
					}}
				>
					✏️ Editar Jefe
				</button>
			</div>

			{/* Formulario para Agregar Jefe */}
			{jefeProyectoMode === "add" && (
				<div className={styles.formSection}>
					<h3>Agregar Jefe a Proyecto</h3>
					
					<div className={styles.field}>
						<label>Seleccionar Proyecto</label>
						<select
							className={styles.select}
							value={jefeProyectoSeleccionado}
							onChange={(e) => {
								setJefeProyectoSeleccionado(Number(e.target.value) || "");
								setJefeProyectoColaboradorSeleccionado(null);
							}}
						>
							<option value="">Seleccione un proyecto</option>
							{empresasData.flatMap((emp) =>
								emp.unidades?.flatMap((unidad) =>
									unidad.proyectos?.map((proyecto) => (
										<option key={proyecto.idproyecto} value={proyecto.idproyecto}>
											{emp.nombre_empresa} → {unidad.nombreunidad}{unidad.descripcionunidad ? ` (${unidad.descripcionunidad})` : ""} → {proyecto.nombreproyecto}
										</option>
									))
								)
							)}
						</select>
					</div>

					{jefeProyectoSeleccionado && getProyectoConUnidad(jefeProyectoSeleccionado as number) && (
						<div className={styles.proyectoInfoCard}>
							<div className={styles.proyectoInfoHeader}>
								<span className={styles.proyectoInfoIcon}>📋</span>
								<h4>Detalle del Proyecto Seleccionado</h4>
							</div>
							<div className={styles.proyectoInfoGrid}>
								<div className={styles.proyectoInfoItem}>
									<span className={styles.proyectoInfoLabel}>🏢 Empresa</span>
									<span className={styles.proyectoInfoValue}>{getProyectoConUnidad(jefeProyectoSeleccionado as number)?.empresa.nombre_empresa}</span>
								</div>
								<div className={styles.proyectoInfoItem}>
									<span className={styles.proyectoInfoLabel}>🏗️ Unidad de Negocio</span>
									<span className={styles.proyectoInfoValue}>{getProyectoConUnidad(jefeProyectoSeleccionado as number)?.unidad.nombreunidad}</span>
								</div>
								<div className={styles.proyectoInfoItem}>
									<span className={styles.proyectoInfoLabel}>📂 Proyecto</span>
									<span className={styles.proyectoInfoValue}>{getProyectoConUnidad(jefeProyectoSeleccionado as number)?.proyecto.nombreproyecto}</span>
								</div>
							</div>
							{getProyectoConUnidad(jefeProyectoSeleccionado as number)?.unidad.descripcionunidad && (
								<div className={styles.unidadDescripcionBanner}>
									<span className={styles.unidadDescripcionLabel}>📝 Descripción de la Unidad</span>
									<p className={styles.unidadDescripcionTexto}>{getProyectoConUnidad(jefeProyectoSeleccionado as number)?.unidad.descripcionunidad}</p>
								</div>
							)}
						</div>
					)}

					<div className={styles.field}>
						<label>Buscar Colaborador por Cédula</label>
						<input
							type="text"
							className={styles.input}
							placeholder="Ingresa la cédula del colaborador"
							value={jefeProyectoCedula}
							onChange={(e) => {
								setJefeProyectoCedula(e.target.value);
								handleBuscarColaboradorJefe(e.target.value);
							}}
						/>
					</div>

					{/* Resultados de búsqueda */}
					{jefeProyectoSearchResults.length > 0 && (
						<div className={styles.searchResults}>
							{jefeProyectoSearchResults.map((usuario) => (
								<button
									key={usuario.id_colaborador}
									type="button"
									className={`${styles.addButton} ${
										jefeProyectoColaboradorSeleccionado?.id_colaborador === usuario.id_colaborador
											? styles.selectedButton
											: ""
									}`}
									onClick={() => handleSeleccionarColaboradorJefe(usuario)}
								>
									{jefeProyectoColaboradorSeleccionado?.id_colaborador === usuario.id_colaborador
										? "✓ "
										: ""}
									{usuario.cc_colaborador} - {usuario.nombre_colaborador} {usuario.apellido_colaborador}
								</button>
							))}
						</div>
					)}

					{/* Colaborador seleccionado */}
					{jefeProyectoColaboradorSeleccionado && (
						<div className={styles.previewSection}>
							<h4>Colaborador seleccionado</h4>
							<ul className={styles.examenList}>
								<li>
									<strong>Cédula:</strong> {jefeProyectoColaboradorSeleccionado.cc_colaborador}
								</li>
								<li>
									<strong>Nombre:</strong> {jefeProyectoColaboradorSeleccionado.nombre_colaborador}{" "}
									{jefeProyectoColaboradorSeleccionado.apellido_colaborador}
								</li>
								<li>
									<strong>Correo:</strong> {jefeProyectoColaboradorSeleccionado.correo_colaborador}
								</li>
								<li>
									<strong>Cargo:</strong> {jefeProyectoColaboradorSeleccionado.nombrecargo || "N/A"}
								</li>
							</ul>
						</div>
					)}

					<div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
						<button
							className={styles.button}
							type="button"
							onClick={handleAgregarJefe}
							disabled={!jefeProyectoSeleccionado || !jefeProyectoColaboradorSeleccionado || saving}
						>
							Asignar Jefe
						</button>
						<button
							className={`${styles.button} ${styles.buttonSecondary}`}
							type="button"
							onClick={resetJefeProyectoForm}
						>
							Cancelar
						</button>
					</div>
				</div>
			)}

			{/* Formulario para Editar Jefe */}
			{jefeProyectoMode === "edit" && (
				<div className={styles.formSection}>
					<h3>Editar Jefe de Proyecto</h3>
					
					<div className={styles.field}>
						<label>Seleccionar Proyecto</label>
						<select
							className={styles.select}
							value={jefeProyectoSeleccionado}
							onChange={(e) => {
								setJefeProyectoSeleccionado(Number(e.target.value) || "");
								setJefeProyectoColaboradorSeleccionado(null);
								setJefeProyectoActual(null);
							}}
						>
							<option value="">Seleccione un proyecto</option>
							{empresasData.flatMap((emp) =>
								emp.unidades?.flatMap((unidad) =>
									unidad.proyectos?.map((proyecto) => (
										<option key={proyecto.idproyecto} value={proyecto.idproyecto}>
											{emp.nombre_empresa} → {unidad.nombreunidad}{unidad.descripcionunidad ? ` (${unidad.descripcionunidad})` : ""} → {proyecto.nombreproyecto}
										</option>
									))
								)
							)}
						</select>
					</div>

					{jefeProyectoSeleccionado && getProyectoConUnidad(jefeProyectoSeleccionado as number) && (
						<div className={styles.proyectoInfoCard}>
							<div className={styles.proyectoInfoHeader}>
								<span className={styles.proyectoInfoIcon}>📋</span>
								<h4>Detalle del Proyecto Seleccionado</h4>
							</div>
							<div className={styles.proyectoInfoGrid}>
								<div className={styles.proyectoInfoItem}>
									<span className={styles.proyectoInfoLabel}>🏢 Empresa</span>
									<span className={styles.proyectoInfoValue}>{getProyectoConUnidad(jefeProyectoSeleccionado as number)?.empresa.nombre_empresa}</span>
								</div>
								<div className={styles.proyectoInfoItem}>
									<span className={styles.proyectoInfoLabel}>🏗️ Unidad de Negocio</span>
									<span className={styles.proyectoInfoValue}>{getProyectoConUnidad(jefeProyectoSeleccionado as number)?.unidad.nombreunidad}</span>
								</div>
								<div className={styles.proyectoInfoItem}>
									<span className={styles.proyectoInfoLabel}>📂 Proyecto</span>
									<span className={styles.proyectoInfoValue}>{getProyectoConUnidad(jefeProyectoSeleccionado as number)?.proyecto.nombreproyecto}</span>
								</div>
							</div>
							{getProyectoConUnidad(jefeProyectoSeleccionado as number)?.unidad.descripcionunidad && (
								<div className={styles.unidadDescripcionBanner}>
									<span className={styles.unidadDescripcionLabel}>📝 Descripción de la Unidad</span>
									<p className={styles.unidadDescripcionTexto}>{getProyectoConUnidad(jefeProyectoSeleccionado as number)?.unidad.descripcionunidad}</p>
								</div>
							)}
						</div>
					)}

				{jefeProyectoSeleccionado && jefeProyectoActual && (
					<div className={styles.previewSection}>
						<h4>Jefe actual</h4>
						<ul className={styles.examenList}>
							<li>
								<strong>Cédula:</strong> {jefeProyectoActual.cedula}
							</li>
							<li>
								<strong>Nombre:</strong> {jefeProyectoActual.nombre} {jefeProyectoActual.apellido}
							</li>
							<li>
								<strong>Correo:</strong> {jefeProyectoActual.correo}
							</li>
						</ul>
					</div>
				)}

				<div className={styles.field}>
					<label>Buscar Nuevo Colaborador por Cédula</label>
						<div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
							<input
								type="text"
								className={styles.input}
								placeholder="Ingresa la cédula del colaborador"
								value={jefeProyectoCedula}
								onChange={(e) => {
									setJefeProyectoCedula(e.target.value);
									handleBuscarColaboradorJefe(e.target.value);
								}}
							/>
						</div>

						{jefeProyectoSearchResults.length > 0 && (
							<div className={styles.searchResults}>
								{jefeProyectoSearchResults.map((usuario) => (
									<button
										key={usuario.id_colaborador}
										type="button"
										className={`${styles.addButton} ${
											jefeProyectoColaboradorSeleccionado?.id_colaborador === usuario.id_colaborador
												? styles.selectedButton
												: ""
										}`}
										onClick={() => handleSeleccionarColaboradorJefe(usuario)}
									>
										{jefeProyectoColaboradorSeleccionado?.id_colaborador === usuario.id_colaborador
											? "✓ "
											: ""}
										{usuario.cc_colaborador} - {usuario.nombre_colaborador} {usuario.apellido_colaborador}
									</button>
								))}
							</div>
						)}

						{jefeProyectoColaboradorSeleccionado && (
							<div className={styles.previewSection}>
								<h4>Nuevo colaborador seleccionado</h4>
								<ul className={styles.examenList}>
									<li>
										<strong>Cédula:</strong> {jefeProyectoColaboradorSeleccionado.cc_colaborador}
									</li>
									<li>
										<strong>Nombre:</strong> {jefeProyectoColaboradorSeleccionado.nombre_colaborador}{" "}
										{jefeProyectoColaboradorSeleccionado.apellido_colaborador}
									</li>
									<li>
										<strong>Correo:</strong> {jefeProyectoColaboradorSeleccionado.correo_colaborador}
									</li>
								</ul>
							</div>
						)}
					</div>

					<div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
						<button
							className={styles.button}
							type="button"
							onClick={handleActualizarJefe}
							disabled={!jefeProyectoSeleccionado || !jefeProyectoColaboradorSeleccionado || saving}
						>
							Actualizar Jefe
						</button>
						{jefeProyectoSeleccionado && (
							<button
								className={`${styles.button} ${styles.buttonDanger}`}
								type="button"
								onClick={() => {
									if (jefeProyectoSeleccionado) {
										handleEliminarJefe(jefeProyectoSeleccionado as number);
										resetJefeProyectoForm();
									}
								}}
								disabled={saving}
							>
								Remover Jefe
							</button>
						)}
						<button
							className={`${styles.button} ${styles.buttonSecondary}`}
							type="button"
							onClick={resetJefeProyectoForm}
						>
							Cancelar
						</button>
					</div>
				</div>
			)}

			{/* Visualización de Jefes por Proyecto */}
			<div style={{ marginTop: "30px" }}>
				<h3>Jefes de Proyectos Actuales</h3>
				<div className={styles.projectsContainer}>
					{empresasData.map((empresa) => (
						<div key={empresa.idempresa}>
							{empresa.unidades?.map((unidad) => (
								<div key={unidad.idunidad}>
									{unidad.proyectos?.map((proyecto) => (
										<div key={proyecto.idproyecto} className={styles.projectCard}>
											<div className={styles.projectHeader}>
												<h4>{proyecto.nombreproyecto}</h4>
												<span className={styles.empresa}>
													{empresa.nombre_empresa} / {unidad.nombreunidad}
												</span>
											</div>
											{unidad.descripcionunidad && (
												<div className={styles.unidadDescBadge}>
													<span className={styles.unidadDescBadgeLabel}>📝 Unidad:</span> {unidad.descripcionunidad}
												</div>
											)}
											<div className={styles.projectBody}>
												{proyecto.jefe_proyecto ? (
													<div className={styles.jefInfo}>
														<p>
															<strong>Jefe:</strong> {proyecto.jefe_proyecto?.nombre}{" "}
															{proyecto.jefe_proyecto?.apellido}
														</p>
														<p>
															<strong>Correo:</strong> {proyecto.jefe_proyecto?.correo}
														</p>
														<button
															className={styles.buttonSmall}
															onClick={() => handleEliminarJefe(proyecto.idproyecto)}
														>
															Remover
														</button>
													</div>
												) : (
													<p className={styles.noJefe}>
														Sin jefe asignado
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							))}
						</div>
					))}
				</div>
				</div>
			</div>
		</div>
	);
}