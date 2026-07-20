// Scheda di allenamento di esempio (precaricata al primo avvio).
// Puoi modificarla, eliminarla o sostituirla completamente dall'app:
// i tuoi dati vengono salvati sul dispositivo (localStorage).

export const DEFAULT_STATE = {
  version: 1,
  workouts: [
    {
      id: "day-a",
      name: "Giorno A · Petto / Tricipiti",
      exercises: [
        { id: "a1", name: "Panca piana con bilanciere", sets: 4, reps: "8-10", restSeconds: 120, weight: "60 kg", notes: "" },
        { id: "a2", name: "Panca inclinata con manubri", sets: 3, reps: "10-12", restSeconds: 90, weight: "22 kg", notes: "" },
        { id: "a3", name: "Croci ai cavi", sets: 3, reps: "12-15", restSeconds: 60, weight: "", notes: "Controlla la fase negativa" },
        { id: "a4", name: "French press", sets: 3, reps: "10-12", restSeconds: 60, weight: "", notes: "" },
        { id: "a5", name: "Push down ai cavi", sets: 3, reps: "12-15", restSeconds: 45, weight: "", notes: "" },
      ],
    },
    {
      id: "day-b",
      name: "Giorno B · Schiena / Bicipiti",
      exercises: [
        { id: "b1", name: "Trazioni alla sbarra", sets: 4, reps: "6-8", restSeconds: 120, weight: "corpo libero", notes: "" },
        { id: "b2", name: "Rematore con bilanciere", sets: 4, reps: "8-10", restSeconds: 90, weight: "50 kg", notes: "" },
        { id: "b3", name: "Lat machine presa larga", sets: 3, reps: "10-12", restSeconds: 75, weight: "", notes: "" },
        { id: "b4", name: "Curl con bilanciere", sets: 3, reps: "10-12", restSeconds: 60, weight: "", notes: "" },
        { id: "b5", name: "Curl a martello", sets: 3, reps: "12", restSeconds: 45, weight: "", notes: "" },
      ],
    },
  ],
};
