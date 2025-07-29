export interface ActivityRecord {
    to: any;
    toPseudo: any;
    id: string;
    date: Date;
    day: Date;
    year: Date;
    month: Date;
    type: string;
    from: string;
    fromId: string;
    fromPseudo: string;
    title: string;
    data: {
      body: string;
    };
    view: string;
    value: number;
    read: number;
    modified: number;
    created: number;
    ID: string;
  }
  
