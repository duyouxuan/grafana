import React, { PureComponent } from 'react';
import TableModel from 'app/core/table_model';

const LEGEND_STYLE = {
  'flex-wrap': 'wrap',
};

const LegendItem = ({ series }) => (
  <div className="graph-legend-series">
    <div className="graph-legend-icon">
      <i className="fa fa-minus pointer" style={{ color: series.color }} />
    </div>
    <a className="graph-legend-alias pointer">{series.alias}</a>
  </div>
);

export default class Table extends PureComponent<any, any> {
  render() {
    const { className = '', data } = this.props;

    return (
      <table className={`${className} filter-table`}>
        <thead>
          <tr>{data.columns.map(col => <th key={col.text}>{col.text}</th>)}</tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => <tr key={i}>{row.map((content, j) => <td key={j}>{content}</td>)}</tr>)}
        </tbody>
      </table>
    );
  }
}
