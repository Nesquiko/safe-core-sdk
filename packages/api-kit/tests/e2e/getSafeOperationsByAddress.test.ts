import SafeApiKit from '@safe-global/api-kit/index'
import { SafeOperationResponse } from '@safe-global/types-kit'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { getApiKit } from '../utils/setupKits'

chai.use(chaiAsPromised)

const SAFE_ADDRESS = '0x60C4Ab82D06Fd7dFE9517e17736C2Dcc77443EF0' // v1.4.1

let safeApiKit: SafeApiKit

describe('getSafeOperationsByAddress', () => {
  before(async () => {
    safeApiKit = getApiKit()
  })

  let safeOperations: SafeOperationResponse[]

  describe('should fail', () => {
    it('should fail if safeAddress is empty', async () => {
      await chai
        .expect(safeApiKit.getSafeOperationsByAddress(''))
        .to.be.rejectedWith('Safe address must not be empty')
    })

    it('should fail if safeAddress is invalid', async () => {
      await chai
        .expect(safeApiKit.getSafeOperationsByAddress('0x123'))
        .to.be.rejectedWith('Invalid Ethereum address 0x123')
    })
  })

  it('should get the SafeOperation list', async () => {
    const response = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS)

    safeOperations = response.results

    chai.expect(response).to.have.property('count').greaterThan(1)
    chai.expect(response).to.have.property('results').to.be.an('array')

    response.results.every((safeOperation) => {
      chai.expect(safeOperation).to.have.property('created')
      chai.expect(safeOperation).to.have.property('modified')
      chai.expect(safeOperation).to.have.property('safeOperationHash')
      chai.expect(safeOperation).to.have.property('validAfter')
      chai.expect(safeOperation).to.have.property('validUntil')
      chai.expect(safeOperation).to.have.property('moduleAddress')
      chai.expect(safeOperation).to.have.property('confirmations').to.be.an('array')
      chai.expect(safeOperation).to.have.property('preparedSignature')
      chai.expect(safeOperation).to.have.property('userOperation')

      chai.expect(safeOperation.userOperation).to.have.property('ethereumTxHash')
      chai.expect(safeOperation.userOperation).to.have.property('sender').to.eq(SAFE_ADDRESS)
      chai.expect(safeOperation.userOperation).to.have.property('userOperationHash')
      chai.expect(safeOperation.userOperation).to.have.property('nonce').to.be.a('string')
      chai.expect(safeOperation.userOperation).to.have.property('initCode')
      chai.expect(safeOperation.userOperation).to.have.property('callData')
      chai.expect(safeOperation.userOperation).to.have.property('callGasLimit').to.be.a('string')
      chai
        .expect(safeOperation.userOperation)
        .to.have.property('verificationGasLimit')
        .to.be.a('string')
      chai
        .expect(safeOperation.userOperation)
        .to.have.property('preVerificationGas')
        .to.be.a('string')
      chai.expect(safeOperation.userOperation).to.have.property('maxFeePerGas').to.be.a('string')
      chai
        .expect(safeOperation.userOperation)
        .to.have.property('maxPriorityFeePerGas')
        .to.be.a('string')
      chai.expect(safeOperation.userOperation).to.have.property('paymaster')
      chai.expect(safeOperation.userOperation).to.have.property('paymasterData')
      chai.expect(safeOperation.userOperation).to.have.property('signature')
      chai.expect(safeOperation.userOperation).to.have.property('entryPoint')
    })
  })

  it('should get a maximum of 3 SafeOperations with limit = 3', async () => {
    const response = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS, { limit: 3 })

    chai.expect(response).to.have.property('count').greaterThan(1)
    chai.expect(response).to.have.property('results').to.be.an('array')
    chai.expect(response.results.length).to.be.lessThanOrEqual(3)
    chai.expect(response.results).to.be.deep.equal(safeOperations.slice(0, 3))
  })

  it('should get all SafeOperations excluding the first one with offset = 1', async () => {
    const response = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS, { offset: 1 })

    chai.expect(response).to.have.property('count').greaterThan(1)
    chai.expect(response).to.have.property('results').to.be.an('array')
    chai.expect(response.results[0]).to.be.deep.equal(safeOperations[1])
  })

  it('should get pending safe operations', async () => {
    const allSafeOperations = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS)

    // Prepared 2 executed SafeOperations in the E2E Safe account
    const pendingSafeOperations = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS, {
      executed: false
    })

    const executedSafeOperations = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS, {
      executed: true
    })

    chai.expect(executedSafeOperations.count).equals(2)
    chai.expect(allSafeOperations.count - pendingSafeOperations.count).equals(2)
  })

  it('should get all safe operations without confirmations', async () => {
    const response = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS, {
      offset: 1,
      hasConfirmations: false
    })

    chai.expect(response).to.have.property('count').equals(0)
    chai.expect(response).to.have.property('results').to.be.an('array')
  })
})
