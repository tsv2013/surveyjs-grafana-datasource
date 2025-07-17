import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
  SelectableValue,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import { SurveyJSQuery, SurveyJSDataSourceOptions, defaultQuery } from './types';

export class DataSource extends DataSourceApi<SurveyJSQuery, SurveyJSDataSourceOptions> {
  async getQuestions(): Promise<SelectableValue[]> {
    const response = await this.doRequest({
      url: '/search',
      method: 'POST',
      data: {
        query: {
          refId: 'questions',
          surveyId: this._instanceSettings.jsonData.surveyId,
          queryText: ''
        },
      },
    });
    return response.data.map((q: any) => ({
      label: q.name || q.title || q.text || q.id || q,
      value: q.id || q,
    }));
  }

  async doRequest(options: any): Promise<any> {
    options.withCredentials = this._instanceSettings.withCredentials;
    options.headers = {'Content-Type': 'application/json'};
    return getBackendSrv().datasourceRequest({
      ...options,
      url: this._instanceSettings.url + options.url,
      // url: this._instanceSettings.jsonData.url + options.url,
    });
  }

  private _instanceSettings: DataSourceInstanceSettings<SurveyJSDataSourceOptions>;
  constructor(instanceSettings: DataSourceInstanceSettings<SurveyJSDataSourceOptions>) {
    super(instanceSettings);
    this._instanceSettings = instanceSettings;
  }

  async query(options: DataQueryRequest<SurveyJSQuery>): Promise<DataQueryResponse> {
    options.targets.forEach(target => {
      target.surveyId = this._instanceSettings.jsonData.surveyId;
    });
    const response = await this.doRequest({
      url: '/query',
      method: 'POST',
      data: options
    });
    const data = response.data.map((targetData: any, targetIndex: number) => {
      const query = defaults(options.targets[targetIndex], defaultQuery);
      return new MutableDataFrame({
        fields: targetData.columns.map((c: any, i: number) => ({
          name: c.text,
          type: ((type) => { switch(type) {
            case 'string': return FieldType.string;
            case 'number': return FieldType.number;
            default: return FieldType.string;
          }
          })(c.type),
          values: targetData.rows.map((r: any) => r[i])
        })),
        refId: query.refId,
        meta: {
          preferredVisualisationType: 'graph',
        },         
      });      
    });

    // const { range } = options;
    // const from = range!.from.valueOf();
    // const to = range!.to.valueOf();
    
    // const data = options.targets.map(target => {
    //   const query = defaults(target, defaultQuery);
    //   return new MutableDataFrame({
    //     refId: query.refId,
    //     fields: [
    //       { name: 'Time', values: [from, to], type: FieldType.time },
    //       { name: 'Value', values: [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)], type: FieldType.number },
    //     ],
    //   });
    // });

    return { data };
  }

  async testDatasource() {
    // Implement a health check for your data source.
    const test = await this.doRequest({
      url: '/',
      method: 'GET'
    });    
    return !!test && test.status === 200 ? {
      ...test.response,
      status: 'success',
      message: 'Success',
    } : {
      status: 'error',
      message: 'Error connecting to the data source',
    };
  }
}
