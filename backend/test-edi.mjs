import { EdiToAdifConverter } from './build/api/adif/utils/edi-to-adif.js';

const testEdiData = `[REG1TEST;1]
TName=Italian Activity Contest
TDate=20220607;20220607
PCall=IU4JJJ
PWWLo=JN54MS
PExch=
PAdr1=
PAdr2=
PSect=2IT
PBand=144 MHz
PClub=E12
RName=PIETRO CERRONE
RCall=IU4JJJ
RAdr1=VIA PANARIA BASSA 57B
RAdr2=41030
RPoCo=41030
RCity=BOMPORTO MODENA
RCoun=ITALIA
RPhon=3356846012
RHBBS=IU4JJJ@LIBERO.IT
MOpe1=
MOpe2=
STXEq=Yaesu FT 991A
SPowe=500
SRXEq=Yaesu FT 991A
SAnte=7 ELEMENTI YAGI
SAntH=20;25
CQSOs=179;1
CQSOP=30766
CWWLs=24;0;1
CWWLB=0
CExcs=0;0;1
CExcB=0
CDXCs=2;0;1
CDXCB=0
CToSc=43766
CODXC=IT9DJF;JM68IE;746
[Remarks]
[QSORecords;179]
220607;1700;IK3XTT;1;59;;59;;;JN55LK;75;;N;N;
220607;1701;IW5CDU;1;59;;59;;;JN53LR;116;;N;;
220607;1704;IZ2ABI;1;59;;59;;;JN45OM;166;;N;;
[END;Created by QARTest 12.5.1]`;

console.log('Testing EDI to ADIF conversion...');
const result = EdiToAdifConverter.convert(testEdiData);

console.log('Conversion Result:');
console.log('Success:', result.success);
console.log('QSOs Read:', result.qsoCount.read);
console.log('QSOs Written:', result.qsoCount.wrote);
console.log('QSOs Errors:', result.qsoCount.errors);
console.log('Station Details:', result.stationDetails);
console.log('\nADIF Output:');
console.log(result.adifData);