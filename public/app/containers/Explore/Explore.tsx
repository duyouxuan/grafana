import React from 'react';
import { hot } from 'react-hot-loader';
// import { observer } from 'mobx-react';
import colors from 'app/core/utils/colors';
import TimeSeries from 'app/core/time_series2';
// import appEvents from 'app/core/app_events';

import ElapsedTime from './ElapsedTime';
import Legend from './Legend';
import QueryField from './QueryField';
import Graph from './Graph';
import Table from './Table';
import { DatasourceSrv } from 'app/features/plugins/datasource_srv';
import TableModel from 'app/core/table_model';

function buildQueryOptions({ format, interval, instant, now, query }) {
  const to = now;
  const from = to - 1000 * 60 * 60 * 3;
  return {
    interval,
    range: {
      from,
      to,
    },
    targets: [
      {
        expr: query,
        format,
        instant,
      },
    ],
  };
}

function makeTimeSeriesList(dataList, options) {
  return dataList.map((seriesData, index) => {
    const datapoints = seriesData.datapoints || [];
    const alias = seriesData.target;

    const colorIndex = index % colors.length;
    const color = colors[colorIndex];

    const series = new TimeSeries({
      datapoints: datapoints,
      alias: alias,
      color: color,
      unit: seriesData.unit,
    });

    if (datapoints && datapoints.length > 0) {
      const last = datapoints[datapoints.length - 1][1];
      const from = options.range.from;
      if (last - from < -10000) {
        series.isOutsideRange = true;
      }
    }

    return series;
  });
}

interface IExploreState {
  datasource: any;
  datasourceError: any;
  datasourceLoading: any;
  graphResult: any;
  latency: number;
  loading: any;
  requestOptions: any;
  tableResult: any;
}

// @observer
export class Explore extends React.Component<any, IExploreState> {
  datasourceSrv: DatasourceSrv;
  query: string;

  constructor(props) {
    super(props);
    this.state = {
      datasource: null,
      datasourceError: null,
      datasourceLoading: true,
      graphResult: null,
      latency: 0,
      loading: false,
      requestOptions: null,
      tableResult: null,
    };
  }

  async componentDidMount() {
    const datasource = await this.props.datasourceSrv.get();
    const testResult = await datasource.testDatasource();
    if (testResult.status === 'success') {
      this.setState({ datasource, datasourceError: null, datasourceLoading: false });
    } else {
      this.setState({ datasource: null, datasourceError: testResult.message, datasourceLoading: false });
    }
  }

  handleRequestError({ error }) {
    console.error(error);
  }

  handleQueryChange = query => {
    this.query = query;
  };

  handleSubmit = () => {
    const mode = 'both';
    if (mode === 'both' || mode === 'table') {
      this.runTableQuery();
    }
    if (mode === 'both' || mode === 'graph') {
      this.runGraphQuery();
    }
  };

  async runGraphQuery() {
    const { query } = this;
    const { datasource } = this.state;
    if (!query) {
      return;
    }
    this.setState({ latency: 0, loading: true, graphResult: null });
    const now = Date.now();
    const options = buildQueryOptions({
      format: 'time_series',
      interval: datasource.interval,
      instant: false,
      now,
      query,
    });
    try {
      const res = await datasource.query(options);
      const result = makeTimeSeriesList(res.data, options);
      const latency = Date.now() - now;
      this.setState({ latency, loading: false, graphResult: result, requestOptions: options });
    } catch (error) {
      console.error(error);
      this.setState({ loading: false, graphResult: error });
    }
  }

  async runTableQuery() {
    const { query } = this;
    const { datasource } = this.state;
    if (!query) {
      return;
    }
    this.setState({ latency: 0, loading: true, tableResult: null });
    const now = Date.now();
    const options = buildQueryOptions({ format: 'table', interval: datasource.interval, instant: true, now, query });
    try {
      const res = await datasource.query(options);
      const tableModel = res.data[0];
      const latency = Date.now() - now;
      this.setState({ latency, loading: false, tableResult: tableModel, requestOptions: options });
    } catch (error) {
      console.error(error);
      this.setState({ loading: false, tableResult: null });
    }
  }

  request = url => {
    const { datasource } = this.state;
    return datasource.metadataRequest(url);
  };

  render() {
    const {
      datasource,
      datasourceError,
      datasourceLoading,
      latency,
      loading,
      requestOptions,
      graphResult,
      tableResult,
    } = this.state;
    return (
      <div>
        <div className="page-body page-full">
          <h2 className="page-sub-heading">Explore</h2>
          {datasourceLoading ? <div>Loading datasource...</div> : null}

          {datasourceError ? <div title={datasourceError}>Error connecting to datasource.</div> : null}

          {datasource ? (
            <div className="m-r-3">
              <div className="nav m-b-1">
                <div className="pull-right" style={{ paddingRight: '6rem' }}>
                  <button type="submit" className="m-l-1 btn btn-primary" onClick={this.handleSubmit}>
                    <i className="fa fa-return" /> Run Query
                  </button>
                </div>
                <div>
                  <button className="btn btn-inverse m-r-1">Graph</button>
                  <button className="btn m-r-0">Table</button>
                </div>
              </div>
              <div className="query-field-wrapper">
                <QueryField
                  request={this.request}
                  onPressEnter={this.handleSubmit}
                  onQueryChange={this.handleQueryChange}
                  onRequestError={this.handleRequestError}
                />
              </div>
              {loading || latency ? <ElapsedTime time={latency} className="m-l-1" /> : null}
              <main className="m-t-2">
                {graphResult ? <Graph data={graphResult} id="explore-1" options={requestOptions} /> : null}
                {graphResult ? <Legend data={graphResult} /> : null}
                {tableResult ? <Table data={tableResult} className="m-t-3" /> : null}
              </main>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

export default hot(module)(Explore);
