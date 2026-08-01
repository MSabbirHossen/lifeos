// exercises-strength.js

export const strengthExercises = [

  // =========================
  // FREEHAND - CHEST
  // =========================

  {
    id: "push_up",
    name: "Push Up",
    category: "Freehand",
    muscle: ["Chest", "Triceps", "Shoulder"],
    type: "Strength",
    met: 5,
    inputType: "sets_reps",
    equipment: "None",
    difficulty: "Beginner"
  },
  {
    id: "slow_push_up",
    name: "Slow Push Up",
    category: "Freehand",
    muscle: ["Chest", "Triceps"],
    type: "Strength",
    met: 6,
    inputType: "sets_reps",
    equipment: "None",
    difficulty: "Intermediate"
  },
  {
    id: "diamond_push_up",
    name: "Diamond Push Up",
    category: "Freehand",
    muscle: ["Triceps", "Chest"],
    type: "Strength",
    met: 6,
    inputType: "sets_reps",
    equipment: "None",
    difficulty: "Intermediate"
  },
  {
    id: "wide_push_up",
    name: "Wide Push Up",
    category: "Freehand",
    muscle: ["Chest"],
    type: "Strength",
    met: 5.5,
    inputType: "sets_reps",
    equipment: "None",
    difficulty: "Beginner"
  },
  {
    id: "incline_push_up",
    name: "Incline Push Up",
    category: "Freehand",
    muscle: ["Chest"],
    type: "Strength",
    met: 4,
    inputType: "sets_reps",
    equipment: "Bench",
    difficulty: "Beginner"
  },
  {
    id: "decline_push_up",
    name: "Decline Push Up",
    category: "Freehand",
    muscle: ["Upper Chest", "Shoulder"],
    type: "Strength",
    met: 6,
    inputType: "sets_reps",
    equipment: "Bench",
    difficulty: "Advanced"
  },
  {
    id: "pike_push_up",
    name: "Pike Push Up",
    category: "Freehand",
    muscle: ["Shoulder", "Triceps"],
    type: "Strength",
    met: 6,
    inputType: "sets_reps",
    equipment: "None",
    difficulty: "Intermediate"
  },


  // =========================
  // FREEHAND - BACK
  // =========================

  {
    id: "pull_up",
    name: "Pull Up",
    category: "Freehand",
    muscle: ["Back", "Biceps"],
    type: "Strength",
    met: 8,
    inputType: "sets_reps",
    equipment: "Bar",
    difficulty: "Advanced"
  },
  {
    id: "chin_up",
    name: "Chin Up",
    category: "Freehand",
    muscle: ["Back", "Biceps"],
    type: "Strength",
    met: 8,
    inputType: "sets_reps",
    equipment: "Bar",
    difficulty: "Advanced"
  },
  {
    id: "negative_pull_up",
    name: "Negative Pull Up",
    category: "Freehand",
    muscle: ["Back"],
    type: "Strength",
    met: 6,
    inputType: "sets_reps",
    equipment: "Bar",
    difficulty: "Intermediate"
  },
  {
    id: "australian_row",
    name: "Australian Row",
    category: "Freehand",
    muscle: ["Back", "Biceps"],
    type: "Strength",
    met: 5,
    inputType: "sets_reps",
    equipment: "Bar",
    difficulty: "Beginner"
  },


  // =========================
  // FREEHAND - LEGS
  // =========================

  {
    id: "bodyweight_squat",
    name: "Bodyweight Squat",
    category: "Freehand",
    muscle: ["Quadriceps", "Glutes"],
    type: "Strength",
    met: 5.5,
    inputType: "sets_reps",
    equipment: "None",
    difficulty: "Beginner"
  },
  {
    id: "jump_squat",
    name: "Jump Squat",
    category: "Freehand",
    muscle: ["Legs", "Glutes"],
    type: "Plyometric",
    met: 8,
    inputType: "sets_reps",
    equipment: "None",
    difficulty: "Intermediate"
  },
  {
    id: "lunges",
    name: "Walking Lunges",
    category: "Freehand",
    muscle: ["Legs", "Glutes"],
    type: "Strength",
    met: 6,
    inputType: "sets_reps",
    equipment: "None",
    difficulty: "Beginner"
  },
  {
    id: "bulgarian_split_squat",
    name: "Bulgarian Split Squat",
    category: "Freehand",
    muscle: ["Quadriceps", "Glutes"],
    type: "Strength",
    met: 6,
    inputType: "sets_reps",
    equipment: "Bench",
    difficulty: "Advanced"
  },
  {
    id: "wall_sit",
    name: "Wall Sit",
    category: "Freehand",
    muscle: ["Quadriceps"],
    type: "Isometric",
    met: 5,
    inputType: "duration",
    equipment: "Wall",
    difficulty: "Beginner"
  },


  // =========================
  // FREEHAND - CORE
  // =========================

  {
    id: "plank",
    name: "Plank",
    category: "Freehand",
    muscle: ["Core"],
    type: "Isometric",
    met: 4,
    inputType: "duration",
    equipment: "None",
    difficulty: "Beginner"
  },
  {
    id: "side_plank",
    name: "Side Plank",
    category: "Freehand",
    muscle: ["Oblique", "Core"],
    type: "Isometric",
    met: 4,
    inputType: "duration",
    equipment: "None",
    difficulty: "Intermediate"
  },
  {
    id: "sit_up",
    name: "Sit Up",
    category: "Freehand",
    muscle: ["Abs"],
    type: "Strength",
    met: 5,
    inputType: "sets_reps",
    equipment: "None",
    difficulty: "Beginner"
  },
  {
    id: "leg_raise",
    name: "Leg Raise",
    category: "Freehand",
    muscle: ["Lower Abs"],
    type: "Strength",
    met: 5,
    inputType: "sets_reps",
    equipment: "None",
    difficulty: "Intermediate"
  },
  {
    id: "mountain_climber",
    name: "Mountain Climber",
    category: "Freehand",
    muscle: ["Core", "Legs"],
    type: "HIIT",
    met: 8,
    inputType: "duration",
    equipment: "None",
    difficulty: "Intermediate"
  },


  // =========================
  // GYM - CHEST
  // =========================

  {
    id: "barbell_bench_press",
    name: "Barbell Bench Press",
    category: "Gym",
    muscle: ["Chest", "Triceps"],
    type: "Strength",
    met: 6,
    inputType: "sets_reps_weight",
    equipment: "Barbell",
    difficulty: "Intermediate"
  },
  {
    id: "incline_bench_press",
    name: "Incline Bench Press",
    category: "Gym",
    muscle: ["Upper Chest"],
    type: "Strength",
    met: 6,
    inputType: "sets_reps_weight",
    equipment: "Barbell",
    difficulty: "Intermediate"
  },
  {
    id: "dumbbell_press",
    name: "Dumbbell Chest Press",
    category: "Gym",
    muscle: ["Chest"],
    type: "Strength",
    met: 6,
    inputType: "sets_reps_weight",
    equipment: "Dumbbell",
    difficulty: "Beginner"
  },


  // =========================
  // GYM - BACK
  // =========================

  {
    id: "deadlift",
    name: "Deadlift",
    category: "Gym",
    muscle: ["Back", "Hamstring", "Glutes"],
    type: "Strength",
    met: 8,
    inputType: "sets_reps_weight",
    equipment: "Barbell",
    difficulty: "Advanced"
  },
  {
    id: "lat_pulldown",
    name: "Lat Pulldown",
    category: "Gym",
    muscle: ["Back"],
    type: "Strength",
    met: 6,
    inputType: "sets_reps_weight",
    equipment: "Machine",
    difficulty: "Beginner"
  },


  // =========================
  // GYM - LEGS
  // =========================

  {
    id: "barbell_squat",
    name: "Barbell Squat",
    category: "Gym",
    muscle: ["Quadriceps", "Glutes"],
    type: "Strength",
    met: 8,
    inputType: "sets_reps_weight",
    equipment: "Barbell",
    difficulty: "Advanced"
  },
  {
    id: "leg_press",
    name: "Leg Press",
    category: "Gym",
    muscle: ["Legs"],
    type: "Strength",
    met: 6,
    inputType: "sets_reps_weight",
    equipment: "Machine",
    difficulty: "Beginner"
  }

];