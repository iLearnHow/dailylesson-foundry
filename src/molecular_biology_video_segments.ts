export interface VideoSegment {
  filename: string;
  segment: string;
  question_text?: string;
  option_a?: string;
  option_b?: string;
}

export const videoSegments: VideoSegment[] = [
  {
    filename: "/509512b167604d07923bc22063466c43.mp4",
    segment: "opening"
  },
  {
    filename: "/509512b167604d07923bc22063466c43 (1).mp4",
    segment: "q1_setup",
    question_text: "cooperation vs competition in biological systems",
    option_a: "molecules compete against each other for survival",
    option_b: "molecules work together to create life and health"
  },
  {
    filename: "/509512b167604d07923bc22063466c43 (2).mp4",
    segment: "q1_correct"
  },
  {
    filename: "/2c6f1b7f06ce40fc964c919daefbb45d.mp4",
    segment: "q1_incorrect"
  },
  {
    filename: "/48a7fe1c92b246b1be666172062c9dac.mp4",
    segment: "q2_setup",
    question_text: "complexity emerging from simple building blocks",
    option_a: "complex life requires complex molecular building blocks",
    option_b: "simple molecular building blocks create complex life through organization"
  },
  {
    filename: "/84fa1e773f8043fab3ffc99a976de252.mp4",
    segment: "q2_correct"
  },
  {
    filename: "/28faa0e663c1469e996b34acd031ec4e.mp4",
    segment: "q2_incorrect"
  },
  {
    filename: "/8a116ce3cf8f482ba14c323e12015414.mp4",
    segment: "q3_setup",
    question_text: "communication and information in biological systems",
    option_a: "molecules work randomly without communication or planning",
    option_b: "molecules communicate and share information to coordinate life processes"
  },
  {
    filename: "/c6c24c7183094f72a84d8b36d6c69531.mp4",
    segment: "q3_correct"
  },
  {
    filename: "/81838217defd459491c2003fb9ce0ba7.mp4",
    segment: "q3_incorrect"
  },
  {
    filename: "/cb1420aecf4d4694a28a31cbdd9676c8.mp4",
    segment: "fortune"
  }
]; 