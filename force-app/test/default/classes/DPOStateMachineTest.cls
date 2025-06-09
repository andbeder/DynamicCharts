@IsTest
public class DPOStateMachineTest {
    @IsTest
    static void testConstructor() {
        DPOStateMachine sm = new DPOStateMachine();
        System.assertNotEquals(null, sm);
    }
}
