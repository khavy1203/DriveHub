export type KQSHSubject = {
  LoaiSH: 'L' | 'H' | 'D' | 'M' | string;
  NgaySH: string;
  DiemSH: number | null;
  DiemToiDa: number | null;
  DiemToiThieu: number | null;
  VangSH: 0 | 1;
  KetQuaSH: 'DA' | 'KDA' | 'VA' | string;
};

export type KQSHRecord = {
  id: number;
  MaKySH: string;
  SoBaoDanh: number;
  HangGPLX: string | null;
  NgaySH: string | null;
  KetQuaSH: 'DA' | 'KDA' | 'VA' | string;
  DiemLyThuyet: number | null;
  DiemHinh: number | null;
  DiemDuong: number | null;
  DiemMoPhong: number | null;
  SoQDSH: string | null;
  subjects: KQSHSubject[];
};

export type KQSHResponse = {
  hoTen: string;
  records: KQSHRecord[];
};

export type SyncResult = {
  synced: number;
  skipped: number;
  errors: string[];
};
