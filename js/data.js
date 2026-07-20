// Scheda di allenamento precaricata al primo avvio: Programma di
// Riabilitazione Gomito - Mese 1 (Recupero Capitello Radiale).
// Puoi modificarla, eliminarla o sostituirla completamente dall'app:
// i tuoi dati vengono salvati sul dispositivo (localStorage).

const RISCALDAMENTO = [
  {
    id: "warmup-1",
    name: "Cardio leggero",
    sets: 1,
    reps: "5 min",
    restSeconds: 0,
    weight: "",
    notes:
      "Corsa sul posto, jumping jacks (senza usare le braccia) o skip leggero: aumenta la temperatura corporea e lubrifica le articolazioni senza stressare il gomito.",
  },
  {
    id: "warmup-2",
    name: "Flesso-estensione assistita",
    sets: 2,
    reps: "15",
    restSeconds: 20,
    weight: "",
    notes:
      "Seduto, braccio appoggiato su un tavolo: la mano sana guida il polso flettendolo ed estendendolo dolcemente. Movimento fluido, fermati subito al minimo fastidio (soglia max 3/10).",
  },
  {
    id: "warmup-3",
    name: "Prono-supinazione attiva",
    sets: 3,
    reps: "12",
    restSeconds: 20,
    weight: "",
    notes:
      "Gomito a 90° contro il fianco: ruota lentamente l'avambraccio, palmo verso l'alto (supinazione) e verso il basso (pronazione).",
  },
  {
    id: "warmup-4",
    name: "Isometria bicipiti/tricipiti",
    sets: 2,
    reps: "8 (hold 5s)",
    restSeconds: 20,
    weight: "",
    notes:
      "Gomito a 90°: la mano sana oppone resistenza mentre tenti di flettere/estendere. Mantieni la contrazione 5 secondi.",
  },
];

const DEFATICAMENTO = [
  {
    id: "cooldown-1",
    name: "Stretching polsi",
    sets: 1,
    reps: "30 sec/posizione",
    restSeconds: 15,
    weight: "",
    notes: "A braccio teso, fletti e distendi il polso aiutandoti con la mano sana.",
  },
  {
    id: "cooldown-2",
    name: "Allungamento globale",
    sets: 1,
    reps: "30 sec",
    restSeconds: 0,
    weight: "",
    notes:
      "Allunga quadricipiti e glutei; appoggia i palmi piatti contro la parete (senza tirare) per aprire il petto.",
  },
];

export const DEFAULT_STATE = {
  version: 1,
  workouts: [
    {
      id: "day-a",
      name: "Giorno A · Catena Anteriore — Mese 1",
      exercises: [
        ...RISCALDAMENTO,
        {
          id: "a5",
          name: "Goblet squat modificato",
          sets: 4,
          reps: "12",
          restSeconds: 75,
          weight: "",
          notes:
            "Circuito: 3-4 giri, riposo 60-90s tra esercizi. Schiena dritta; se il peso al petto infastidisce il gomito usa un elastico sulle spalle o solo corpo libero.",
        },
        {
          id: "a6",
          name: "Wall push-up (piegamenti al muro)",
          sets: 4,
          reps: "10-12",
          restSeconds: 75,
          weight: "",
          notes:
            "Circuito: 3-4 giri. Vietati i piegamenti a terra: il lavoro al muro azzera il carico assiale sul capitello radiale.",
        },
        {
          id: "a7",
          name: "Affondi frontali",
          sets: 4,
          reps: "12/lato",
          restSeconds: 75,
          weight: "",
          notes: "Circuito: 3-4 giri. Corpo libero, mani sui fianchi; il ginocchio posteriore sfiora il suolo.",
        },
        {
          id: "a8",
          name: "Dead bug",
          sets: 4,
          reps: "40 sec",
          restSeconds: 75,
          weight: "",
          notes:
            "Circuito: 3-4 giri. Supino a terra: estendi alternativamente braccio e gamba opposta, schiena aderente al suolo.",
        },
        {
          id: "a9",
          name: "Estensioni tricipiti con elastico",
          sets: 4,
          reps: "15",
          restSeconds: 75,
          weight: "",
          notes:
            "Circuito: 3-4 giri. Elastico fissato in alto: fletti ed estendi il gomito. Non forzare la massima estensione se senti dolore.",
        },
        ...DEFATICAMENTO,
      ],
    },
    {
      id: "day-b",
      name: "Giorno B · Catena Posteriore — Mese 1",
      exercises: [
        ...RISCALDAMENTO.map((ex) => ({ ...ex, id: ex.id.replace("warmup", "warmup-b") })),
        {
          id: "b5",
          name: "Hip thrust (su panca)",
          sets: 4,
          reps: "15",
          restSeconds: 75,
          weight: "",
          notes: "Circuito: 3-4 giri, riposo 60-90s tra esercizi. Spingi il bacino verso l'alto contraendo i glutei; braccia passive.",
        },
        {
          id: "b6",
          name: "Rematore con elastico",
          sets: 4,
          reps: "12",
          restSeconds: 75,
          weight: "",
          notes:
            "Circuito: 3-4 giri. Seduto a terra, elastico ai piedi: tira i gomiti verso i fianchi. L'elastico evita i picchi di trazione sull'epicondilo tipici del manubrio pesante.",
        },
        {
          id: "b7",
          name: "Stacchi gambe tese / RDL leggero",
          sets: 4,
          reps: "12",
          restSeconds: 75,
          weight: "leggero",
          notes:
            "Circuito: 3-4 giri. Scendi con pesi leggeri lungo le gambe, spingendo i glutei indietro. Non usare carichi pesanti: la presa (grip) stresserebbe l'avambraccio.",
        },
        {
          id: "b8",
          name: "Ponte glutei a una gamba",
          sets: 4,
          reps: "10/lato",
          restSeconds: 75,
          weight: "",
          notes: "Circuito: 3-4 giri. Spinta del bacino a gamba singola.",
        },
        {
          id: "b9",
          name: "Curl bicipiti con elastico leggerissimo",
          sets: 4,
          reps: "15",
          restSeconds: 75,
          weight: "",
          notes: "Circuito: 3-4 giri. Fletti l'avambraccio con fase di discesa molto lenta e controllata.",
        },
        ...DEFATICAMENTO.map((ex) => ({ ...ex, id: ex.id.replace("cooldown", "cooldown-b") })),
      ],
    },
  ],
};
