/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { TebraSoapClient } from '../tebraSoapClient';
import soap from 'soap';

jest.mock('soap', () => ({
  createClientAsync: jest.fn(),
  BasicAuthSecurity: class {},
}));

const mockedSoap = soap as unknown as {
  createClientAsync: jest.Mock;
};

describe('TebraSoapClient', () => {
  const mockPatientResponse = [{ patientId: '123', firstName: 'John', lastName: 'Doe' }];
  const dummyCredentials = {
    wsdlUrl: 'https://example.com/wsdl',
    username: 'test-user',
    password: 'test-pass'
  };
  let client: TebraSoapClient;

  beforeEach(() => {
    jest.resetAllMocks();
    client = new TebraSoapClient(dummyCredentials);
    // Resetting private cache for test
    client['client'] = null;
  });

  it('should call GetPatientAsync with correct parameters', async () => {
    // Arrange
    const mockClient: any = {
      setSecurity: jest.fn(),
      GetPatientAsync: jest.fn().mockResolvedValue(mockPatientResponse),
    };
    mockedSoap.createClientAsync.mockResolvedValue(mockClient);

    // Act
    const result = await client.getPatientById('123');

    // Assert
    expect(mockedSoap.createClientAsync).toHaveBeenCalled();
    expect(mockClient.setSecurity).toHaveBeenCalled();
    expect(mockClient.GetPatientAsync).toHaveBeenCalledWith({ patientId: '123' });
    expect(result).toEqual(mockPatientResponse[0]);
  });

  it('should call SearchPatientsAsync and return patients array', async () => {
    const patients = { patients: [{ id: 'a' }, { id: 'b' }] };
    const mockClient: any = {
      setSecurity: jest.fn(),
      SearchPatientsAsync: jest.fn().mockResolvedValue([patients]),
    };
    mockedSoap.createClientAsync.mockResolvedValue(mockClient);

    const result = await client.searchPatients('Smith');

    expect(mockClient.SearchPatientsAsync).toHaveBeenCalledWith({ lastName: 'Smith' });
    expect(result).toEqual(patients.patients);
  });
});   