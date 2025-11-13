import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import {
  Users,
  Calendar,
  Stethoscope,
  FileText,
  Settings,
  LogOut,
  Loader2,
  Menu,
  X,
  Bell,
  Plus,
  Save,
  Trash2,
  Edit,
} from "lucide-react";

// --- Constantes y Configuración de Firebase ---
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
const firebaseConfig = JSON.parse(
  typeof __firebase_config !== "undefined" ? __firebase_config : "{}"
);
const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;

// Colores primarios para el tema hospitalario
const PRIMARY_COLOR = "bg-teal-600";
const PRIMARY_COLOR_HOVER = "hover:bg-teal-700";
const ACCENT_COLOR = "text-teal-400";

// Componente de Indicador de Carga
const LoadingIndicator = ({ message = "Cargando..." }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-white/80 rounded-xl shadow-2xl">
    <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
    <p className="text-lg font-semibold text-gray-700">{message}</p>
  </div>
);

// Componente de Modal para Confirmaciones/Alertas
const CustomModal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transition-all duration-300 transform scale-100">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- Componente de Gestión de Pacientes (ADMISION.Paciente) ---
const PatientsView = ({ db, userId, getPrivateCollectionPath }) => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState({
    Nombre: "",
    Apellido: "",
    FechaNacimiento: "",
    Genero: "M",
    Direccion: "",
    Telefono: "",
    Email: "",
    FechaRegistro: "",
  });
  const [modalType, setModalType] = useState("add");
  const [statusMessage, setStatusMessage] = useState(null);

  // Escucha de Pacientes en tiempo real (Firestore)
  useEffect(() => {
    if (!db || !userId) return;

    const path = getPrivateCollectionPath("pacientes");
    const q = query(collection(db, path));

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const patientList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          FechaRegistro: doc.data().FechaRegistro?.toDate
            ? doc.data().FechaRegistro.toDate()
            : doc.data().FechaRegistro,
        }));
        setPatients(patientList);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error al escuchar pacientes:", error);
        setStatusMessage({
          type: "error",
          text: "Error al cargar los pacientes.",
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, userId, getPrivateCollectionPath]);

  // Manejador de cambio de formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPatient((prev) => ({ ...prev, [name]: value }));
  };

  // Abrir Modal para agregar
  const openAddModal = () => {
    setCurrentPatient({
      Nombre: "",
      Apellido: "",
      FechaNacimiento: "",
      Genero: "M",
      Direccion: "",
      Telefono: "",
      Email: "",
      FechaRegistro: "",
    });
    setModalType("add");
    setIsModalOpen(true);
  };

  // Abrir Modal para editar
  const openEditModal = (patient) => {
    setCurrentPatient({
      id: patient.id,
      Nombre: patient.Nombre,
      Apellido: patient.Apellido,
      FechaNacimiento: patient.FechaNacimiento,
      Genero: patient.Genero,
      Direccion: patient.Direccion,
      Telefono: patient.Telefono,
      Email: patient.Email,
    });
    setModalType("edit");
    setIsModalOpen(true);
  };

  // Guardar o Actualizar Paciente
  const handleSubmit = async (e) => {
    e.preventDefault();
    const path = getPrivateCollectionPath("pacientes");
    if (!db || !path) return;

    try {
      const patientData = {
        Nombre: currentPatient.Nombre.trim(),
        Apellido: currentPatient.Apellido.trim(),
        FechaNacimiento: currentPatient.FechaNacimiento, // YYYY-MM-DD string
        Genero: currentPatient.Genero,
        Direccion: currentPatient.Direccion,
        Telefono: currentPatient.Telefono,
        Email: currentPatient.Email,
      };

      if (modalType === "add") {
        await addDoc(collection(db, path), {
          ...patientData,
          FechaRegistro: serverTimestamp(),
          ID_Paciente_Simulado: Math.floor(Math.random() * 1000000),
        });
        setStatusMessage({
          type: "success",
          text: `Paciente ${patientData.Nombre} agregado exitosamente.`,
        });
      } else {
        // 'edit'
        const patientRef = doc(db, path, currentPatient.id);
        await setDoc(patientRef, patientData, { merge: true });
        setStatusMessage({
          type: "success",
          text: `Paciente ${patientData.Nombre} actualizado exitosamente.`,
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error(
        `Error al ${modalType === "add" ? "agregar" : "actualizar"} paciente:`,
        error
      );
      setStatusMessage({
        type: "error",
        text: `Error al procesar el paciente: ${error.message}`,
      });
    }
  };

  const PatientForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-4">
        <input
          type="text"
          name="Nombre"
          value={currentPatient.Nombre}
          onChange={handleInputChange}
          placeholder="Nombre"
          required
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
        />
        <input
          type="text"
          name="Apellido"
          value={currentPatient.Apellido}
          onChange={handleInputChange}
          placeholder="Apellido"
          required
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
        />
      </div>
      <div className="flex space-x-4">
        <input
          type="date"
          name="FechaNacimiento"
          value={currentPatient.FechaNacimiento}
          onChange={handleInputChange}
          required
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
          title="Fecha de Nacimiento"
        />
        <select
          name="Genero"
          value={currentPatient.Genero}
          onChange={handleInputChange}
          required
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
        >
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
          <option value="O">Otro</option>
        </select>
      </div>
      <div className="flex space-x-4">
        <input
          type="email"
          name="Email"
          value={currentPatient.Email}
          onChange={handleInputChange}
          placeholder="Email"
          required
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
        />
        <input
          type="tel"
          name="Telefono"
          value={currentPatient.Telefono}
          onChange={handleInputChange}
          placeholder="Teléfono"
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
        />
      </div>
      <input
        type="text"
        name="Direccion"
        value={currentPatient.Direccion}
        onChange={handleInputChange}
        placeholder="Dirección"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
      />

      <button
        type="submit"
        className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-semibold ${PRIMARY_COLOR} ${PRIMARY_COLOR_HOVER} transition-all duration-200 shadow-md`}
      >
        <Save className="w-5 h-5 mr-2" />
        {modalType === "add" ? "Registrar Paciente" : "Guardar Cambios"}
      </button>
    </form>
  );

  const PatientTable = () => {
    if (isLoading)
      return <LoadingIndicator message="Cargando lista de pacientes..." />;
    if (patients.length === 0) {
      return (
        <div className="text-center p-12 bg-teal-50 rounded-xl border border-dashed border-teal-200">
          <Users className="w-12 h-12 text-teal-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 font-semibold">
            No hay pacientes registrados.
          </p>
          <p className="text-gray-500">
            Comience agregando uno usando el botón "Nuevo Paciente".
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre Completo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                F. Nacimiento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Email
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr
                key={patient.id}
                className="hover:bg-teal-50 transition duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {patient.Nombre} {patient.Apellido}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.FechaNacimiento || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-teal-600 hidden md:table-cell">
                  {patient.Email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-center space-x-2">
                  <button
                    onClick={() => openEditModal(patient)}
                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 transition"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-teal-800">
          Gestión de Pacientes
        </h2>
        <button
          onClick={openAddModal}
          className={`flex items-center py-2 px-4 rounded-xl text-white font-semibold ${PRIMARY_COLOR} ${PRIMARY_COLOR_HOVER} transition-all duration-200 shadow-lg`}
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Paciente
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-3 mb-4 rounded-lg flex items-center justify-between transition-opacity duration-300 ${
            statusMessage.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
          role="alert"
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="ml-4 p-1 rounded-full hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <PatientTable />
      </div>

      <CustomModal
        isOpen={isModalOpen}
        title={
          modalType === "add"
            ? "Registrar Nuevo Paciente"
            : `Editar Paciente: ${currentPatient.Nombre}`
        }
        onClose={() => setIsModalOpen(false)}
      >
        <PatientForm />
      </CustomModal>
    </div>
  );
};

// --- Componente de Gestión de Personal Médico (SEGURIDAD.PersonalMedico) ---
const StaffView = ({ db, userId, getPrivateCollectionPath }) => {
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState({
    Nombre: "",
    Apellido: "",
    Cargo: "Doctor", // Default, basado en MSTR.TipoPersonal o similar
    Especialidad: "",
    NumColegiado: "", // Simulación del campo de licencia/cédula
    Telefono: "",
    Email: "",
    FechaIngreso: "", // Simulación de FechaContratacion
  });
  const [modalType, setModalType] = useState("add");
  const [statusMessage, setStatusMessage] = useState(null);

  // Escucha de Personal en tiempo real (Firestore)
  useEffect(() => {
    if (!db || !userId) return;

    const path = getPrivateCollectionPath("personal_medico");
    const q = query(collection(db, path));

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const staffList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          FechaIngreso: doc.data().FechaIngreso?.toDate
            ? doc.data().FechaIngreso.toDate()
            : doc.data().FechaIngreso,
        }));
        setStaff(staffList);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error al escuchar personal:", error);
        setStatusMessage({
          type: "error",
          text: "Error al cargar el personal.",
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, userId, getPrivateCollectionPath]);

  // Manejador de cambio de formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentStaff((prev) => ({ ...prev, [name]: value }));
  };

  // Abrir Modal para agregar
  const openAddModal = () => {
    setCurrentStaff({
      Nombre: "",
      Apellido: "",
      Cargo: "Doctor",
      Especialidad: "",
      NumColegiado: "",
      Telefono: "",
      Email: "",
      FechaIngreso: "",
    });
    setModalType("add");
    setIsModalOpen(true);
  };

  // Abrir Modal para editar
  const openEditModal = (member) => {
    setCurrentStaff({
      id: member.id,
      Nombre: member.Nombre,
      Apellido: member.Apellido,
      Cargo: member.Cargo,
      Especialidad: member.Especialidad || "",
      NumColegiado: member.NumColegiado,
      Telefono: member.Telefono || "",
      Email: member.Email,
      FechaIngreso:
        member.FechaIngreso instanceof Date
          ? member.FechaIngreso.toISOString().split("T")[0]
          : member.FechaIngreso,
    });
    setModalType("edit");
    setIsModalOpen(true);
  };

  // Guardar o Actualizar Personal
  const handleSubmit = async (e) => {
    e.preventDefault();
    const path = getPrivateCollectionPath("personal_medico");
    if (!db || !path) return;

    try {
      const staffData = {
        Nombre: currentStaff.Nombre.trim(),
        Apellido: currentStaff.Apellido.trim(),
        Cargo: currentStaff.Cargo,
        Especialidad:
          currentStaff.Cargo === "Doctor"
            ? currentStaff.Especialidad.trim()
            : null, // Especialidad solo para doctores
        NumColegiado: currentStaff.NumColegiado.trim(),
        Telefono: currentStaff.Telefono.trim(),
        Email: currentStaff.Email.trim(),
      };

      // Asigna un RolID simulado basado en el cargo
      const ID_Rol_Simulado = currentStaff.Cargo === "Doctor" ? "R100" : "R200";

      if (modalType === "add") {
        await addDoc(collection(db, path), {
          ...staffData,
          FechaIngreso: serverTimestamp(), // FechaContratacion
          ID_Rol: ID_Rol_Simulado,
        });
        setStatusMessage({
          type: "success",
          text: `${staffData.Cargo} ${staffData.Apellido} agregado exitosamente.`,
        });
      } else {
        // 'edit'
        const staffRef = doc(db, path, currentStaff.id);
        await setDoc(staffRef, staffData, { merge: true });
        setStatusMessage({
          type: "success",
          text: `${staffData.Cargo} ${staffData.Apellido} actualizado exitosamente.`,
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error(
        `Error al ${modalType === "add" ? "agregar" : "actualizar"} personal:`,
        error
      );
      setStatusMessage({
        type: "error",
        text: `Error al procesar el personal: ${error.message}`,
      });
    }
  };

  // Formulario de Personal (Agregar/Editar)
  const StaffForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre y Apellido */}
      <div className="flex space-x-4">
        <input
          type="text"
          name="Nombre"
          value={currentStaff.Nombre}
          onChange={handleInputChange}
          placeholder="Nombre"
          required
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
        />
        <input
          type="text"
          name="Apellido"
          value={currentStaff.Apellido}
          onChange={handleInputChange}
          placeholder="Apellido"
          required
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
        />
      </div>

      {/* Cargo y Especialidad (condicional) */}
      <div className="flex space-x-4">
        <select
          name="Cargo"
          value={currentStaff.Cargo}
          onChange={handleInputChange}
          required
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
        >
          <option value="Doctor">Doctor</option>
          <option value="Enfermera">Enfermera</option>
          <option value="Administrador">Administrador</option>
        </select>
        {currentStaff.Cargo === "Doctor" && (
          <input
            type="text"
            name="Especialidad"
            value={currentStaff.Especialidad}
            onChange={handleInputChange}
            placeholder="Especialidad (e.g., Pediatría)"
            required={currentStaff.Cargo === "Doctor"}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
          />
        )}
      </div>

      {/* Número de Colegiado/Licencia y Email */}
      <div className="flex space-x-4">
        <input
          type="text"
          name="NumColegiado"
          value={currentStaff.NumColegiado}
          onChange={handleInputChange}
          placeholder="Número de Colegiado/Licencia"
          required
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
        />
        <input
          type="email"
          name="Email"
          value={currentStaff.Email}
          onChange={handleInputChange}
          placeholder="Email"
          required
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
        />
      </div>

      {/* Teléfono */}
      <input
        type="tel"
        name="Telefono"
        value={currentStaff.Telefono}
        onChange={handleInputChange}
        placeholder="Teléfono"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
      />

      {/* Botón de envío */}
      <button
        type="submit"
        className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-semibold ${PRIMARY_COLOR} ${PRIMARY_COLOR_HOVER} transition-all duration-200 shadow-md`}
      >
        <Save className="w-5 h-5 mr-2" />
        {modalType === "add" ? "Registrar Personal" : "Guardar Cambios"}
      </button>
    </form>
  );

  // Muestra de la tabla de Personal
  const StaffTable = () => {
    if (isLoading)
      return <LoadingIndicator message="Cargando lista de personal..." />;
    if (staff.length === 0) {
      return (
        <div className="text-center p-12 bg-teal-50 rounded-xl border border-dashed border-teal-200">
          <Stethoscope className="w-12 h-12 text-teal-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 font-semibold">
            No hay personal registrado.
          </p>
          <p className="text-gray-500">
            Comience agregando uno usando el botón "Nuevo Personal".
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre Completo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cargo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Especialidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Email
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((member) => (
              <tr
                key={member.id}
                className="hover:bg-teal-50 transition duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {member.Nombre} {member.Apellido}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      member.Cargo === "Doctor"
                        ? "bg-indigo-100 text-indigo-800"
                        : member.Cargo === "Enfermera"
                        ? "bg-pink-100 text-pink-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {member.Cargo}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                  {member.Especialidad || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-teal-600 hidden md:table-cell">
                  {member.Email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-center space-x-2">
                  <button
                    onClick={() => openEditModal(member)}
                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 transition"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  {/* El botón de eliminar se implementará en pasos posteriores */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-teal-800">
          Gestión de Personal
        </h2>
        <button
          onClick={openAddModal}
          className={`flex items-center py-2 px-4 rounded-xl text-white font-semibold ${PRIMARY_COLOR} ${PRIMARY_COLOR_HOVER} transition-all duration-200 shadow-lg`}
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Personal
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-3 mb-4 rounded-lg flex items-center justify-between transition-opacity duration-300 ${
            statusMessage.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
          role="alert"
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="ml-4 p-1 rounded-full hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <StaffTable />
      </div>

      <CustomModal
        isOpen={isModalOpen}
        title={
          modalType === "add"
            ? "Registrar Nuevo Personal"
            : `Editar Personal: ${currentStaff.Nombre}`
        }
        onClose={() => setIsModalOpen(false)}
      >
        <StaffForm />
      </CustomModal>
    </div>
  );
};

// --- Componente principal de la aplicación (Actualizado para navegación) ---
const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentView, setCurrentView] = useState("patients"); // Estado de navegación
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // 1. Inicialización de Firebase y Autenticación
  useEffect(() => {
    if (Object.keys(firebaseConfig).length === 0) {
      console.error(
        "Firebase config is missing or empty. Cannot initialize Firebase."
      );
      setIsAuthReady(true);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      setDb(dbInstance);
      setAuth(authInstance);

      const signInUser = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
          } else {
            await signInAnonymously(authInstance);
          }
        } catch (error) {
          console.error("Error signing in with Firebase:", error);
        }
      };

      signInUser();

      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        if (user) {
          setUserId(user.uid);
          console.log("Authenticated User ID:", user.uid);
        } else {
          setUserId(null);
          console.log("User is signed out.");
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      setIsAuthReady(true);
    }
  }, []);

  // Función para obtener la ruta base de las colecciones privadas
  const getPrivateCollectionPath = useCallback(
    (collectionName) => {
      if (!userId) return null;
      return `artifacts/${appId}/users/${userId}/${collectionName}`;
    },
    [userId]
  );

  // Navegación principal (Sidebar)
  const navItems = [
    { id: "patients", label: "Pacientes", icon: Users },
    { id: "staff", label: "Personal", icon: Stethoscope },
    { id: "records", label: "Expedientes", icon: FileText }, // Cambiamos 'appointments' a 'records'
    { id: "reports", label: "Reportes", icon: FileText },
  ];

  const Sidebar = () => (
    <nav
      className={`fixed inset-y-0 left-0 transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64 ${PRIMARY_COLOR} text-white p-4 z-40 flex flex-col justify-between shadow-xl`}
    >
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            HYGIA{" "}
            <span className="text-teal-200 text-base font-medium block leading-none">
              Gestión Hospitalaria
            </span>
          </h1>
          <button
            className="md:hidden p-1 rounded-full hover:bg-teal-500"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setIsSidebarOpen(false);
              }}
              className={`flex items-center w-full py-3 px-4 rounded-xl text-lg font-medium transition-all duration-200 mb-2 ${
                isActive
                  ? "bg-white text-teal-700 shadow-md scale-105"
                  : "text-teal-100 opacity-80 " + PRIMARY_COLOR_HOVER
              }`}
            >
              <Icon className="w-6 h-6 mr-3" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-teal-500/50">
        <button
          onClick={() => setCurrentView("settings")}
          className="flex items-center w-full py-2 px-4 rounded-xl text-teal-100 opacity-80 hover:bg-teal-700 transition-colors duration-200"
        >
          <Settings className="w-5 h-5 mr-3" />
          Ajustes
        </button>
        <button
          onClick={() => console.log("Cerrar Sesión simulado.")}
          className="flex items-center w-full py-2 px-4 rounded-xl text-red-300 opacity-80 hover:bg-teal-700 transition-colors duration-200 mt-2"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );

  // Renderiza la vista principal basada en el estado `currentView`
  const renderMainContent = () => {
    if (isDataLoading) {
      return <LoadingIndicator message="Cargando datos de la vista..." />;
    }

    if (!db || !userId) {
      return (
        <LoadingIndicator message="Esperando la conexión a la base de datos..." />
      );
    }

    switch (currentView) {
      case "patients":
        return (
          <PatientsView
            db={db}
            userId={userId}
            getPrivateCollectionPath={getPrivateCollectionPath}
          />
        );
      case "staff":
        return (
          <StaffView
            db={db}
            userId={userId}
            getPrivateCollectionPath={getPrivateCollectionPath}
          />
        );
      case "records":
        return (
          <div className="p-6 bg-white rounded-xl shadow-lg h-full">
            <h2 className="text-3xl font-bold text-teal-800 mb-6">
              Expedientes Clínicos (HCE)
            </h2>
            <p>Contenido para el módulo de Historia Clínica Electrónica.</p>
          </div>
        );
      case "reports":
        return (
          <div className="p-6 bg-white rounded-xl shadow-lg h-full">
            <h2 className="text-3xl font-bold text-teal-800 mb-6">
              Reportes y Estadísticas
            </h2>
            <p>Contenido para reportes.</p>
          </div>
        );
      case "settings":
        return (
          <div className="p-6 bg-white rounded-xl shadow-lg h-full">
            <h2 className="text-3xl font-bold text-teal-800 mb-6">
              Ajustes del Sistema
            </h2>
            <p>Contenido para configuración de usuario y sistema.</p>
          </div>
        );
      default:
        return (
          <PatientsView
            db={db}
            userId={userId}
            getPrivateCollectionPath={getPrivateCollectionPath}
          />
        );
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingIndicator message="Conectando al Sistema de Autenticación..." />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans">
      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar de Navegación */}
      <Sidebar />

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Encabezado (Header) */}
        <header className="flex items-center justify-between p-4 md:p-6 bg-white shadow-md sticky top-0 z-20">
          <div className="flex items-center">
            <button
              className="md:hidden mr-4 p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6 text-teal-600" />
            </button>
            <h2 className="text-2xl font-semibold text-gray-800 capitalize">
              {navItems.find((item) => item.id === currentView)?.label ||
                "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="text-right hidden sm:block">
              <p className="font-medium text-gray-700">Administrador</p>
              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                ID: {userId}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal-200 flex items-center justify-center text-teal-800 font-bold text-lg">
              {userId ? userId[0].toUpperCase() : "U"}
            </div>
          </div>
        </header>

        {/* Área de Contenido de la Vista */}
        <main className="p-4 md:p-6 flex-1 overflow-y-auto">
          {/* Muestra el ID de usuario completo requerido para aplicaciones multi-usuario */}
          <div className="mb-4 text-xs text-gray-500 bg-gray-100 p-2 rounded-lg">
            **ID de Usuario (Firebase):**{" "}
            <span className="font-mono text-gray-700 break-all">{userId}</span>
          </div>

          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
