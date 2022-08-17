import { parse } from 'csv-parse/sync';
import moment from 'moment';

const COUNTIES = {
  slc: 'Salt Lake',
  bv: 'Davis',
  utah: 'Utah',
  weber: 'Weber',
  boxelder: 'Box Elder',
  cache: 'Cache',
  tooele: 'Tooele',
  washington: 'Washington',
  p2: 'Carbon',
  rs: 'Duchesne',
  v4: 'Uintah',
};
const FIELDS = {
  Day: 'Day', // e.g. 2017-04-03
  County: 'County', // e.g. slc
  Severity: 'Severity', // possible values: good, ??
  Action: 'Action', // possible values: unrestricted, ??
  Message: 'Message', // ??
};
const COLORS = {
  good: 'green',
  moderate: 'yellow',
  unhealthyforsensitivegroups: 'orange',
  unhealthy: 'red',
  veryunhealthy: 'purple',
  hazardous: 'brown',
};

export default function (csvText, date, county) {
  const records = parse(csvText, {
    columns: true,
  });

  let data;
  const found = records.some((record) => {
    if (record[FIELDS.Day] === moment(date).format('YYYY-MM-DD') && COUNTIES[record[FIELDS.County]] === county) {
      data = record;

      return true;
    }
  });

  if (!found) {
    throw new Error(`No data available for ${county} county!`);
  }

  return {
    color: COLORS[data[FIELDS.Severity]],
  };
}
